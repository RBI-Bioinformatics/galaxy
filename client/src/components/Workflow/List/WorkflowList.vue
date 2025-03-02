<script setup lang="ts">
import { library } from "@fortawesome/fontawesome-svg-core";
import { faStar, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { BAlert, BButton, BNav, BNavItem, BOverlay, BPagination } from "bootstrap-vue";
import { filter } from "underscore";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router/composables";

import { GalaxyApi } from "@/api";
import { helpHtml, WorkflowFilters } from "@/components/Workflow/List/WorkflowFilters";
import { Toast } from "@/composables/toast";
import { useUserStore } from "@/stores/userStore";
import { rethrowSimple } from "@/utils/simple-error";

import FilterMenu from "@/components/Common/FilterMenu.vue";
import Heading from "@/components/Common/Heading.vue";
import ListHeader from "@/components/Common/ListHeader.vue";
import LoginRequired from "@/components/Common/LoginRequired.vue";
import LoadingSpan from "@/components/LoadingSpan.vue";
import WorkflowCard from "@/components/Workflow/List/WorkflowCard.vue";
import WorkflowListActions from "@/components/Workflow/List/WorkflowListActions.vue";

library.add(faStar, faTrash);

type ListView = "grid" | "list";
type WorkflowsList = Record<string, never>[];

interface Props {
    activeList?: "my" | "shared_with_me" | "published";
}

const props = withDefaults(defineProps<Props>(), {
    activeList: "my",
});

const router = useRouter();
const userStore = useUserStore();

const limit = ref(24);
const offset = ref(0);
const loading = ref(true);
const overlay = ref(false);
const filterText = ref("");
const totalWorkflows = ref(0);
const showAdvanced = ref(false);
const showBookmarked = ref(false);
const listHeader = ref<any>(null);
const workflowsLoaded = ref<WorkflowsList>([]);

const searchPlaceHolder = computed(() => {
    let placeHolder = "Search my workflows";

    if (published.value) {
        placeHolder = "Search published workflows";
    } else if (sharedWithMe.value) {
        placeHolder = "Search workflows shared with me";
    }

    placeHolder += " by query or use the advanced filtering options";

    return placeHolder;
});

const published = computed(() => props.activeList === "published");
const sharedWithMe = computed(() => props.activeList === "shared_with_me");
const showDeleted = computed(() => filterText.value.includes("is:deleted"));
const currentPage = computed(() => Math.floor(offset.value / limit.value) + 1);
const view = computed(() => (userStore.preferredListViewMode as ListView) || "grid");
const sortDesc = computed(() => (listHeader.value && listHeader.value.sortDesc) ?? true);
const sortBy = computed(() => (listHeader.value && listHeader.value.sortBy) || "update_time");
const noItems = computed(() => !loading.value && workflowsLoaded.value.length === 0 && !filterText.value);
const noResults = computed(() => !loading.value && workflowsLoaded.value.length === 0 && filterText.value);
const deleteButtonTitle = computed(() => (showDeleted.value ? "Hide deleted workflows" : "Show deleted workflows"));
const bookmarkButtonTitle = computed(() =>
    showBookmarked.value ? "Hide bookmarked workflows" : "Show bookmarked workflows"
);

// Filtering computed refs
const workflowFilters = computed(() => WorkflowFilters(props.activeList));
const rawFilters = computed(() =>
    Object.fromEntries(workflowFilters.value.getFiltersForText(filterText.value, true, false))
);
const validFilters = computed(() => workflowFilters.value.getValidFilters(rawFilters.value, true).validFilters);
const invalidFilters = computed(() => workflowFilters.value.getValidFilters(rawFilters.value, true).invalidFilters);
const isSurroundedByQuotes = computed(() => /^["'].*["']$/.test(filterText.value));
const hasInvalidFilters = computed(() => !isSurroundedByQuotes.value && Object.keys(invalidFilters.value).length > 0);

function updateFilterValue(filterKey: string, newValue: any) {
    const currentFilterText = filterText.value;
    filterText.value = workflowFilters.value.setFilterValue(currentFilterText, filterKey, newValue);
}

function toggleBookmarked(bookmarked?: boolean) {
    showBookmarked.value = bookmarked ?? !showBookmarked.value;
}

function onToggleBookmarked() {
    toggleBookmarked();
}

function onToggleDeleted() {
    updateFilterValue("deleted", true);
    toggleBookmarked(false);
}

async function load(overlayLoading = false, silent = false) {
    if (!silent) {
        if (overlayLoading) {
            overlay.value = true;
        } else {
            loading.value = true;
        }
    }
    let search;
    if (!hasInvalidFilters.value) {
        search = validatedFilterText();

        // append default backend query filters for provided `props.activeList`
        if (published.value && !workflowFilters.value.getFilterValue(search, "published")) {
            search += " is:published";
        }
        if (sharedWithMe.value && !workflowFilters.value.getFilterValue(search, "shared_with_me")) {
            search += " is:shared_with_me";
        }
    } else {
        // there are invalid filters, so we don't want to search
        overlay.value = false;
        loading.value = false;
        return;
    }

    try {
        const { response, data, error } = await GalaxyApi().GET("/api/workflows", {
            params: {
                query: {
                    sort_by: sortBy.value,
                    sort_desc: sortDesc.value,
                    limit: limit.value,
                    offset: offset.value,
                    search: search?.trim(),
                    show_published: published.value,
                    skip_step_counts: true,
                },
            },
        });

        if (error) {
            rethrowSimple(error);
        }

        let filteredWorkflows = showBookmarked.value
            ? filter(data, (workflow: any) => workflow.show_in_tool_panel)
            : data;

        if (props.activeList === "my") {
            filteredWorkflows = filter(filteredWorkflows, (w: any) => userStore.matchesCurrentUsername(w.owner));
        }

        workflowsLoaded.value = filteredWorkflows;

        if (showBookmarked.value) {
            totalWorkflows.value = filteredWorkflows.length;
        } else {
            totalWorkflows.value = parseInt(response.headers.get("Total_matches") || "0", 10) || 0;
        }
    } catch (e) {
        Toast.error(`Failed to load workflows: ${e}`);
    } finally {
        overlay.value = false;
        loading.value = false;
    }
}

async function onPageChange(page: number) {
    offset.value = (page - 1) * limit.value;
    await load(true);
}

function validatedFilterText() {
    if (isSurroundedByQuotes.value) {
        // the `filterText` is surrounded by quotes, remove them
        return filterText.value.slice(1, -1);
    } else if (Object.keys(rawFilters.value).length === 0) {
        // there are no filters derived from the `filterText`
        return filterText.value;
    }
    // there are valid filters derived from the `filterText`
    return workflowFilters.value.getFilterText(validFilters.value, true);
}

watch([filterText, sortBy, sortDesc, showBookmarked], async () => {
    offset.value = 0;
    await load(true);
});

onMounted(() => {
    if (router.currentRoute.query.owner) {
        updateFilterValue("user", `'${router.currentRoute.query.owner}'`);
    }
    load();
});
</script>

<template>
    <div id="workflows-list" class="workflows-list">
        <div id="workflows-list-header" class="workflows-list-header mb-2">
            <div class="d-flex flex-gapx-1">
                <Heading h1 separator inline size="xl" class="flex-grow-1 mb-2">Workflows</Heading>

                <WorkflowListActions />
            </div>

            <BNav pills justified class="mb-2">
                <BNavItem id="my" :active="activeList === 'my'" :disabled="userStore.isAnonymous" to="/workflows/list">
                    My workflows
                    <LoginRequired v-if="userStore.isAnonymous" target="my" title="Manage your workflows" />
                </BNavItem>

                <BNavItem
                    id="shared-with-me"
                    :active="sharedWithMe"
                    :disabled="userStore.isAnonymous"
                    to="/workflows/list_shared_with_me">
                    Workflows shared with me
                    <LoginRequired v-if="userStore.isAnonymous" target="shared-with-me" title="Manage your workflows" />
                </BNavItem>

                <BNavItem id="published" :active="published" to="/workflows/list_published">
                    Public workflows
                </BNavItem>
            </BNav>

            <FilterMenu
                id="workflow-list-filter"
                name="workflows"
                class="mb-2"
                :filter-class="workflowFilters"
                :filter-text.sync="filterText"
                :loading="loading || overlay"
                has-help
                view="compact"
                :placeholder="searchPlaceHolder"
                :show-advanced.sync="showAdvanced">
                <template v-slot:menu-help-text>
                    <div v-html="helpHtml(activeList)"></div>
                </template>
            </FilterMenu>

            <ListHeader ref="listHeader" show-view-toggle>
                <template v-slot:extra-filter>
                    <div v-if="activeList === 'my'">
                        Filter:
                        <BButton
                            id="show-deleted"
                            v-b-tooltip.hover
                            size="sm"
                            :title="deleteButtonTitle"
                            :pressed="showDeleted"
                            variant="outline-primary"
                            @click="onToggleDeleted">
                            <FontAwesomeIcon :icon="faTrash" fixed-width />
                            Show deleted
                        </BButton>

                        <BButton
                            id="show-bookmarked"
                            v-b-tooltip.hover
                            size="sm"
                            :title="bookmarkButtonTitle"
                            :pressed="showBookmarked"
                            :disabled="showDeleted"
                            variant="outline-primary"
                            @click="onToggleBookmarked">
                            <FontAwesomeIcon :icon="faStar" fixed-width />
                            Show bookmarked
                        </BButton>
                    </div>
                </template>
            </ListHeader>
        </div>

        <BAlert v-if="loading" variant="info" show>
            <LoadingSpan message="Loading workflows..." />
        </BAlert>

        <BAlert v-if="!loading && !overlay && noItems" id="workflow-list-empty" variant="info" show>
            No workflows found. You may create or import new workflows using the buttons above.
        </BAlert>

        <!-- There are either `noResults` or `invalidFilters` -->
        <span v-else-if="!loading && !overlay && (noResults || hasInvalidFilters)">
            <BAlert v-if="!hasInvalidFilters" id="no-workflow-found" variant="info" show>
                No workflows found matching: <span class="font-weight-bold">{{ filterText }}</span>
            </BAlert>

            <BAlert v-else id="no-workflow-found-invalid" variant="danger" show>
                <Heading h4 inline size="sm" class="flex-grow-1 mb-2">Invalid filters in query:</Heading>
                <ul>
                    <li v-for="[invalidKey, value] in Object.entries(invalidFilters)" :key="invalidKey">
                        <b>{{ invalidKey }}</b
                        >: {{ value }}
                    </li>
                </ul>
                <a href="javascript:void(0)" class="ui-link" @click="filterText = validatedFilterText()">
                    Remove invalid filters from query
                </a>
                or
                <a
                    v-b-tooltip.noninteractive.hover
                    title="Note that this might produce inaccurate results"
                    href="javascript:void(0)"
                    class="ui-link"
                    @click="filterText = `'${filterText}'`">
                    Match the exact query provided
                </a>
            </BAlert>
        </span>

        <BOverlay
            v-else
            id="workflow-cards"
            :show="overlay"
            rounded="sm"
            class="cards-list mt-2"
            :class="view === 'grid' ? 'd-flex flex-wrap' : ''">
            <WorkflowCard
                v-for="w in workflowsLoaded"
                :key="w.id"
                :workflow="w"
                :published-view="published"
                :grid-view="view === 'grid'"
                :class="view === 'grid' ? 'grid-view' : 'list-view'"
                @refreshList="load"
                @tagClick="(tag) => updateFilterValue('tag', `'${tag}'`)"
                @update-filter="updateFilterValue" />

            <BPagination
                v-if="!loading && totalWorkflows > limit"
                class="mt-2 w-100"
                :value="currentPage"
                :total-rows="totalWorkflows"
                :per-page="limit"
                align="center"
                first-number
                last-number
                @change="onPageChange" />
        </BOverlay>
    </div>
</template>

<style lang="scss">
@import "scss/mixins.scss";
@import "breakpoints.scss";

.workflows-list {
    overflow: auto;
    display: flex;
    flex-direction: column;

    .workflow-total {
        display: grid;
        text-align: center;
        margin-top: 1rem;
    }

    .workflows-list-header {
        top: 0;
        z-index: 100;
    }

    .cards-list {
        container: card-list / inline-size;
        scroll-behavior: smooth;
        min-height: 150px;

        overflow-y: auto;
        overflow-x: hidden;

        .list-view {
            width: 100%;
        }

        .grid-view {
            width: calc(100% / 3);
        }

        @container card-list (max-width: #{$breakpoint-xl}) {
            .grid-view {
                width: calc(100% / 2);
            }
        }

        @container card-list (max-width: #{$breakpoint-sm}) {
            .grid-view {
                width: 100%;
            }
        }
    }
}
</style>

import Admin from "entry/analysis/modules/Admin";
import Home from "components/admin/Home";
import ActiveInvocations from "components/admin/ActiveInvocations";
import DataTables from "components/admin/DataTables";
import DataTypes from "components/admin/DataTypes";
import DisplayApplications from "components/admin/DisplayApplications";
import ErrorStack from "components/admin/ErrorStack";
import FormGeneric from "components/Form/FormGeneric";
import Grid from "components/Grid/Grid";
import Jobs from "components/admin/Jobs";
import ResetMetadata from "components/admin/ResetMetadata";
import SanitizeAllow from "components/admin/SanitizeAllow";
import Toolshed from "components/Toolshed/Index";
import ToolboxDependencies from "components/admin/Dependencies/Landing";

export default [
    {
        path: "/admin",
        component: Admin,
        children: [
            { path: "", component: Home },
            { path: "data_tables", component: DataTables },
            { path: "data_types", component: DataTypes },
            { path: "display_applications", component: DisplayApplications },
            { path: "error_stack", component: ErrorStack },
            { path: "invocations", component: ActiveInvocations },
            { path: "jobs", component: Jobs },
            { path: "reset_metadata", component: ResetMetadata },
            { path: "sanitize_allow", component: SanitizeAllow },
            { path: "toolbox_dependencies", component: ToolboxDependencies },
            { path: "toolshed", component: Toolshed },
            {
                path: "users",
                component: Grid,
                props: {
                    urlBase: "admin/users_list",
                },
            },
            {
                path: "form/reset_user_password",
                component: FormGeneric,
                props: (route) => ({
                    title: "Reset passwords",
                    url: `admin/reset_user_password?id=${route.query.id}`,
                    icon: "fa-user",
                    submitTitle: "Save new password",
                    redirect: "admin/users",
                }),
            },
            {
                path: "form/manage_roles_and_groups_for_user",
                component: FormGeneric,
                props: (route) => ({
                    url: `admin/manage_roles_and_groups_for_user?id=${route.query.id}`,
                    icon: "fa-users",
                    redirect: "admin/users",
                }),
            },
            {
                path: "form/manage_users_and_groups_for_role",
                component: FormGeneric,
                props: (route) => ({
                    url: `admin/manage_users_and_groups_for_role?id=${route.query.id}`,
                    redirect: "admin/users",
                }),
            },
            {
                path: "form/manage_users_and_roles_for_group",
                component: FormGeneric,
                props: (route) => ({
                    url: `admin/manage_users_and_roles_for_group?id=${route.query.id}`,
                    redirect: "admin/users",
                }),
            },
            {
                path: "form/manage_users_and_groups_for_quota",
                component: FormGeneric,
                props: (route) => ({
                    url: `admin/manage_users_and_groups_for_quota?id=${route.query.id}`,
                    redirect: "admin/quotas",
                }),
            },
            {
                path: "form/create_role",
                component: FormGeneric,
                props: {
                    url: "admin/create_role",
                    redirect: "admin/roles",
                },
            },
            {
                path: "form/create_group",
                component: FormGeneric,
                props: {
                    url: "admin/create_group",
                    redirect: "admin/groups",
                },
            },
            {
                path: "form/create_quota",
                component: FormGeneric,
                props: {
                    url: "admin/create_quota",
                    redirect: "admin/quotas",
                },
            },
            {
                path: "form/rename_role",
                component: FormGeneric,
                props: (route) => ({
                    url: `admin/rename_role?id=${route.query.id}`,
                    redirect: "admin/roles",
                }),
            },
            {
                path: "form/rename_group",
                component: FormGeneric,
                props: (route) => ({
                    url: `admin/rename_group?id=${route.query.id}`,
                    redirect: "admin/groups",
                }),
            },
            {
                path: "form/rename_quota",
                component: FormGeneric,
                props: (route) => ({
                    url: `admin/rename_quota?id=${route.query.id}`,
                    redirect: "admin/quotas",
                }),
            },
            {
                path: "form/edit_quota",
                component: FormGeneric,
                props: (route) => ({
                    url: `admin/edit_quota?id=${route.query.id}`,
                    redirect: "admin/quotas",
                }),
            },
            {
                path: "form/set_quota_default",
                component: FormGeneric,
                props: (route) => ({
                    url: `admin/set_quota_default?id=${route.query.id}`,
                    redirect: "admin/quotas",
                }),
            },
            {
                path: "form/create_form",
                component: FormGeneric,
                props: {
                    url: "admin/create_form",
                    redirect: "admin/forms",
                },
            },
            {
                path: "form/edit_form",
                component: FormGeneric,
                props: (route) => ({
                    url: `admin/edit_form?id=${route.query.id}`,
                    redirect: "admin/forms",
                }),
            },
        ],
    },
];

/*import { getGalaxyInstance } from "app";
import { getAppRoot } from "onload";
import _l from "utils/localization";
import FormGeneric from "components/Form/FormGeneric";
import GridView from "mvc/grid/grid-view";
import QueryStringParsing from "utils/query-string-parsing";
import Router from "layout/router";
import Landing from "components/admin/Dependencies/Landing.vue";
import DataManager from "components/admin/DataManager";
import RegisterForm from "components/login/RegisterForm.vue";
import { mountVueComponent } from "utils/mountVueComponent";*/

/*
export const getAdminRouter = (Galaxy, options) => {
    const galaxyRoot = getAppRoot();

    return Router.extend({
        routes: {
            "(/)admin(/)": "show_home",
            "(/)admin(/)users": "show_users",
            "(/)admin(/)users(/)create": "show_users_create",
            "(/)admin(/)roles": "show_roles",
            "(/)admin(/)groups": "show_groups",
            "(/)admin(/)toolshed": "show_toolshed",
            "(/)admin(/)error_stack": "show_error_stack",
            "(/)admin(/)display_applications": "show_display_applications",
            "(/)admin(/)tool_versions": "show_tool_versions",
            "(/)admin(/)quotas": "show_quotas",
            "(/)admin(/)forms": "show_forms",
            "(/)admin(/)form(/)(:form_id)": "show_form",
            "(/)admin/data_tables": "show_data_tables",
            "(/)admin/data_types": "show_data_types",
            "(/)admin/jobs": "show_jobs",
            "(/)admin/invocations": "show_invocations",
            "(/)admin/sanitize_allow": "show_sanitize_allow",
            "(/)admin/toolbox_dependencies": "show_toolbox_dependencies",
            "(/)admin/data_manager*path": "show_data_manager",
            "(/)admin(/)reset_metadata": "show_reset_metadata",
            "*notFound": "not_found",
        },

        authenticate: function () {
            const Galaxy = getGalaxyInstance();
            return Galaxy.user && Galaxy.user.id && Galaxy.user.get("is_admin");
        },

        not_found: function () {
            window.location.reload(); // = window.location.href;
        },

        show_home: function () {
            this._display_vue_helper(AdminHome, {
                isRepoInstalled: options.settings.is_repo_installed,
                isToolShedInstalled: options.settings.is_tool_shed_installed,
            });
        },

        show_users: function () {
            this._show_grid_view("admin/users_list");
        },

        show_users_create: function () {
            this._display_vue_helper(RegisterForm, {
                redirect: "/admin/users",
                registration_warning_message: options.config.registration_warning_message,
                mailing_join_addr: options.config.mailing_join_addr,
                server_mail_configured: options.config.server_mail_configured,
            });
        },

        show_roles: function () {
            this._show_grid_view("admin/roles_list");
        },

        show_groups: function () {
            this._show_grid_view("admin/groups_list");
        },

        show_tool_versions: function () {
            this._show_grid_view("admin/tool_versions_list");
        },

        show_quotas: function () {
            this._show_grid_view("admin/quotas_list");
        },

        _show_grid_view: function (urlSuffix) {
            const Galaxy = getGalaxyInstance();
            this.page.display(
                new GridView({
                    url_base: `${galaxyRoot}${urlSuffix}`,
                    url_data: Galaxy.params,
                })
            );
        },

        _display_vue_helper: function (component, propsData = {}) {
            const container = document.createElement("div");
            this.page.display(container);
            const mountFn = mountVueComponent(component);
            return mountFn(propsData, container);
        },

        show_jobs: function () {
            this._display_vue_helper(Jobs);
        },

        show_invocations: function () {
            this._display_vue_helper(ActiveInvocations);
        },

        show_sanitize_allow: function () {
            this._display_vue_helper(SanitizeAllow);
        },

        show_toolbox_dependencies: function () {
            this._display_vue_helper(Landing);
        },

        show_reset_metadata: function () {
            this._display_vue_helper(ResetMetadata);
        },

        // Because this has a router in it, we need to be careful about destroying it properly
        dataManagerInstance: null,
        show_data_manager: function () {
            if (this.dataManagerInstance) {
                this.dataManagerInstance.$destroy();
            }
            this.dataManagerInstance = this._display_vue_helper(DataManager);
        },

        show_forms: function () {
            this._show_grid_view("forms/forms_list");
        },
    });
};
*/

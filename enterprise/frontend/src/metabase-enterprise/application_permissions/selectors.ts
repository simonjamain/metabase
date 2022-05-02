import _ from "underscore";
import { t } from "ttag";
import { createSelector } from "reselect";
import { Group } from "metabase-types/api";
import { isAdminGroup } from "metabase/lib/groups";
import { UNABLE_TO_CHANGE_ADMIN_PERMISSIONS } from "metabase/admin/permissions/constants/messages";
import {
  getAdminGroup,
  getOrderedGroups,
} from "metabase/admin/permissions/selectors/data-permissions/groups";
import { APPLICATION_PERMISSIONS_OPTIONS } from "./constants";
import { getIn } from "icepick";
import { ApplicationPermissionsState } from "./types/state";
import {
  ApplicationPermissionKey,
  ApplicationPermissions,
  ApplicationPermissionValue,
} from "./types/permissions";
import { getDefaultGroupHasHigherAccessText } from "metabase/admin/permissions/selectors/confirmations";

export function getPermissionWarning(
  value: ApplicationPermissionValue,
  defaultGroupValue: ApplicationPermissionValue,
  defaultGroup: Group,
  groupId: Group["id"],
) {
  if (defaultGroupValue === "yes" && value === "no") {
    return getDefaultGroupHasHigherAccessText(defaultGroup);
  }

  return null;
}

export const canManageSubscriptions = (state: ApplicationPermissionsState) =>
  state.currentUser.permissions?.can_access_subscription ?? false;

const getApplicationPermission = (
  permissions: ApplicationPermissions,
  groupId: number,
  permissionKey: ApplicationPermissionKey,
) => getIn(permissions, [groupId, permissionKey]) ?? "no";

export const getIsDirty = createSelector(
  (state: ApplicationPermissionsState) =>
    state.plugins.applicationPermissionsPlugin?.applicationPermissions,
  state =>
    state.plugins.applicationPermissionsPlugin?.originalApplicationPermissions,
  (permissions, originalPermissions) =>
    !_.isEqual(permissions, originalPermissions),
);

const getPermission = (
  permissions: ApplicationPermissions,
  isAdmin: boolean,
  groupId: number,
  defaultGroup: Group,
  permissionKey: ApplicationPermissionKey,
) => {
  const value = getApplicationPermission(permissions, groupId, permissionKey);
  const defaultGroupValue = getApplicationPermission(
    permissions,
    defaultGroup.id,
    permissionKey,
  );

  const warning = getPermissionWarning(
    value,
    defaultGroupValue,
    defaultGroup,
    groupId,
  );

  return {
    permission: permissionKey,
    isDisabled: isAdmin,
    warning,
    disabledTooltip: isAdmin ? UNABLE_TO_CHANGE_ADMIN_PERMISSIONS : null,
    value: getApplicationPermission(permissions, groupId, permissionKey),
    options: [
      APPLICATION_PERMISSIONS_OPTIONS.yes,
      APPLICATION_PERMISSIONS_OPTIONS.no,
    ],
  };
};

export const getApplicationPermissionEditor = createSelector(
  (state: ApplicationPermissionsState) =>
    state.plugins.applicationPermissionsPlugin?.applicationPermissions,
  getOrderedGroups,
  getAdminGroup,
  (permissions, groups: Group[][], defaultGroup?: Group) => {
    if (!permissions || groups == null || !defaultGroup) {
      return null;
    }

    const entities = groups.flat().map(group => {
      const isAdmin = isAdminGroup(group);

      return {
        id: group.id,
        name: group.name,
        permissions: [
          getPermission(
            permissions,
            isAdmin,
            group.id,
            defaultGroup,
            "setting",
          ),
          getPermission(
            permissions,
            isAdmin,
            group.id,
            defaultGroup,
            "monitoring",
          ),
          getPermission(
            permissions,
            isAdmin,
            group.id,
            defaultGroup,
            "subscription",
          ),
        ],
      };
    });

    return {
      filterPlaceholder: t`Search for a group`,
      columns: [
        { name: t`Group name` },
        { name: t`Settings access` },
        {
          name: `Monitoring access`,
          hint: t`This grants access to Tools, Audit, and Troubleshooting`,
        },
        { name: t`Subscriptions and Alerts` },
      ],
      entities,
    };
  },
);

import { getIn } from "icepick";
import { t } from "ttag";
import { Group, GroupsPermissions } from "metabase-types/api";
import { UNABLE_TO_CHANGE_ADMIN_PERMISSIONS } from "metabase/admin/permissions/constants/messages";
import { EntityId, PermissionSubject } from "metabase/admin/permissions/types";
import { getPermissionWarning } from "metabase/admin/permissions/selectors/confirmations";

export const DETAILS_PERMISSION_REQUIRES_DATA_ACCESS = t`Manage database access requires full data access.`;

export const DETAILS_PERMISSION_OPTIONS = {
  no: {
    label: t`No`,
    value: "no",
    icon: "close",
    iconColor: "danger",
  },
  yes: {
    label: t`Yes`,
    value: "yes",
    icon: "check",
    iconColor: "success",
  },
};

const DETAILS_PERMISSIONS_DESC = [
  DETAILS_PERMISSION_OPTIONS.yes.value,
  DETAILS_PERMISSION_OPTIONS.no.value,
];

const getDetailsPermission = (
  permissions: GroupsPermissions,
  groupId: number,
  databaseId: number,
) =>
  getIn(permissions, [groupId, databaseId, "details"]) ??
  DETAILS_PERMISSION_OPTIONS.no.value;

export const buildDetailsPermission = (
  entityId: EntityId,
  groupId: number,
  isAdmin: boolean,
  permissions: GroupsPermissions,
  defaultGroup: Group,
  permissionSubject: PermissionSubject,
) => {
  if (permissionSubject !== "schemas") {
    return null;
  }

  const value = getDetailsPermission(permissions, groupId, entityId.databaseId);
  const defaultGroupValue = getDetailsPermission(
    permissions,
    defaultGroup.id,
    entityId.databaseId,
  );

  const warning = getPermissionWarning(
    value,
    defaultGroupValue,
    permissionSubject,
    defaultGroup,
    groupId,
    DETAILS_PERMISSIONS_DESC,
  );

  return {
    permission: "details",
    type: "details",
    value,
    isDisabled: isAdmin,
    isHighlighted: isAdmin,
    warning,
    disabledTooltip: isAdmin
      ? UNABLE_TO_CHANGE_ADMIN_PERMISSIONS
      : DETAILS_PERMISSION_REQUIRES_DATA_ACCESS,
    options: [DETAILS_PERMISSION_OPTIONS.no, DETAILS_PERMISSION_OPTIONS.yes],
  };
};

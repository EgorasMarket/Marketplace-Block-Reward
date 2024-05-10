const { Staff, Roles, Permission, RolePermissions } = require("../models");

const checkPermission = async (staffId, permName) => {
  return true;
};
// const checkPermission = async (staffId, permName) => {
//   const staff = await Staff.findOne({
//     where: { staffId },
//   });

//   if (!staff) {
//     return false;
//   }

//   const role = await Roles.findOne({
//     where: { id: staff.roleId },
//   });

//   if (role.name === "super_admin") {
//     return true;
//   }

//   const permission = await Permission.findOne({
//     where: { permName },
//   });

//   if (!permission) {
//     return false;
//   }

//   const rolePermissionExist = await RolePermissions.findOne({
//     where: { roleId: staff.roleId, permissionId: permission.id },
//   });

//   if (rolePermissionExist) {
//     return true;
//   }
//   return false;
// };

export default checkPermission;

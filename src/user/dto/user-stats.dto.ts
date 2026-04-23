export interface UserStatsDto {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  ownerUsers: number;
  tenantUsers: number;
  usersCreatedThisMonth: number;
  usersCreatedThisWeek: number;
}

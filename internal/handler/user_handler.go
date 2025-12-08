package handler

import (
	"net/http"
	"nodepassPanel/internal/middleware"
	"nodepassPanel/internal/service"
	"nodepassPanel/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
)

// UserHandler 用户处理器
type UserHandler struct {
	userService *service.UserService
}

// NewUserHandler 创建用户处理器实例
func NewUserHandler() *UserHandler {
	return &UserHandler{
		userService: service.NewUserService(),
	}
}

// ==================== 用户端接口 ====================

// GetProfile 获取当前用户信息
// @Summary 获取当前用户信息
// @Tags User
// @Success 200 {object} response.Response
// @Router /api/v1/user/profile [get]
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	profile, err := h.userService.GetProfile(userID)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, profile)
}

// ChangePassword 修改密码
// @Summary 修改密码
// @Tags User
// @Accept json
// @Param request body service.ChangePasswordRequest true "密码信息"
// @Success 200 {object} response.Response
// @Router /api/v1/user/password [put]
func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req service.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.userService.ChangePassword(userID, &req); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// GetTrafficStats 获取流量统计
// @Summary 获取流量统计
// @Tags User
// @Success 200 {object} response.Response
// @Router /api/v1/user/traffic [get]
func (h *UserHandler) GetTrafficStats(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	stats, err := h.userService.GetTrafficStats(userID)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, stats)
}

// ResetSubscribeToken 重置订阅令牌
// @Summary 重置订阅令牌
// @Tags User
// @Success 200 {object} response.Response
// @Router /api/v1/user/subscribe/reset [post]
func (h *UserHandler) ResetSubscribeToken(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	newToken, err := h.userService.ResetSubscribeToken(userID)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, gin.H{"token": newToken})
}

// ==================== 管理员接口 ====================

// AdminList 获取用户列表
// @Summary 获取用户列表（管理员）
// @Tags Admin/User
// @Param page query int false "页码"
// @Param page_size query int false "每页数量"
// @Param search query string false "搜索关键词"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users [get]
func (h *UserHandler) AdminList(c *gin.Context) {
	var query service.UserListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.userService.GetUserList(&query)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, result)
}

// AdminGet 获取用户详情
// @Summary 获取用户详情（管理员）
// @Tags Admin/User
// @Param id path int true "用户ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users/{id} [get]
func (h *UserHandler) AdminGet(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid user id")
		return
	}

	user, err := h.userService.GetUserByID(uint(id))
	if err != nil {
		response.Error(c, http.StatusNotFound, "user not found")
		return
	}

	response.Success(c, user)
}

// AdminUpdate 更新用户
// @Summary 更新用户（管理员）
// @Tags Admin/User
// @Accept json
// @Param id path int true "用户ID"
// @Param request body service.AdminUpdateUserRequest true "用户信息"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users/{id} [put]
func (h *UserHandler) AdminUpdate(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid user id")
		return
	}

	var req service.AdminUpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.userService.UpdateUser(uint(id), &req)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, user)
}

// AdminDelete 删除用户
// @Summary 删除用户（管理员）
// @Tags Admin/User
// @Param id path int true "用户ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users/{id} [delete]
func (h *UserHandler) AdminDelete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid user id")
		return
	}

	if err := h.userService.DeleteUser(uint(id)); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// AdminResetTraffic 重置用户流量
// @Summary 重置用户流量（管理员）
// @Tags Admin/User
// @Param id path int true "用户ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users/{id}/reset-traffic [post]
func (h *UserHandler) AdminResetTraffic(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid user id")
		return
	}

	if err := h.userService.ResetTraffic(uint(id)); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// ChargeRequest 充值请求
type ChargeRequest struct {
	Amount float64 `json:"amount" binding:"required"`
}

// AdminCharge 用户充值
// @Summary 用户充值（管理员）
// @Tags Admin/User
// @Accept json
// @Param id path int true "用户ID"
// @Param request body ChargeRequest true "充值金额"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users/{id}/charge [post]
func (h *UserHandler) AdminCharge(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid user id")
		return
	}

	var req ChargeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.userService.ChargeUser(uint(id), req.Amount); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// AdminBan 禁用用户
// @Summary 禁用用户（管理员）
// @Tags Admin/User
// @Param id path int true "用户ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users/{id}/ban [post]
func (h *UserHandler) AdminBan(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid user id")
		return
	}

	if err := h.userService.BanUser(uint(id)); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// AdminUnban 解禁用户
// @Summary 解禁用户（管理员）
// @Tags Admin/User
// @Param id path int true "用户ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users/{id}/unban [post]
func (h *UserHandler) AdminUnban(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid user id")
		return
	}

	if err := h.userService.UnbanUser(uint(id)); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// ==================== 批量操作接口 ====================

// BatchBan 批量禁用用户
// @Summary 批量禁用用户（管理员）
// @Tags Admin/User
// @Accept json
// @Param request body service.UserBatchRequest true "用户ID列表"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users/batch/ban [post]
func (h *UserHandler) BatchBan(c *gin.Context) {
	var req service.UserBatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	count, err := h.userService.BatchUpdateStatus(req.IDs, 0)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, gin.H{"affected": count})
}

// BatchUnban 批量启用用户
// @Summary 批量启用用户（管理员）
// @Tags Admin/User
// @Accept json
// @Param request body service.UserBatchRequest true "用户ID列表"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users/batch/unban [post]
func (h *UserHandler) BatchUnban(c *gin.Context) {
	var req service.UserBatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	count, err := h.userService.BatchUpdateStatus(req.IDs, 1)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, gin.H{"affected": count})
}

// BatchCharge 批量充值
// @Summary 批量充值（管理员）
// @Tags Admin/User
// @Accept json
// @Param request body service.UserBatchChargeRequest true "用户ID和金额"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users/batch/charge [post]
func (h *UserHandler) BatchCharge(c *gin.Context) {
	var req service.UserBatchChargeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	count, err := h.userService.BatchCharge(req.IDs, req.Amount)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, gin.H{"affected": count})
}

// BatchDelete 批量删除用户
// @Summary 批量删除用户（管理员）
// @Tags Admin/User
// @Accept json
// @Param request body service.UserBatchRequest true "用户ID列表"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users/batch/delete [post]
func (h *UserHandler) BatchDelete(c *gin.Context) {
	var req service.UserBatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	count, err := h.userService.BatchDelete(req.IDs)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, gin.H{"affected": count})
}

// BatchResetTraffic 批量重置流量
// @Summary 批量重置流量（管理员）
// @Tags Admin/User
// @Accept json
// @Param request body service.UserBatchRequest true "用户ID列表"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/users/batch/reset-traffic [post]
func (h *UserHandler) BatchResetTraffic(c *gin.Context) {
	var req service.UserBatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	count, err := h.userService.BatchResetTraffic(req.IDs)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, gin.H{"affected": count})
}

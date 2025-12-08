package handler

import (
	"net/http"
	"nodepassPanel/internal/middleware"
	"nodepassPanel/internal/service"
	"nodepassPanel/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
)

// VerifyCodeHandler 验证码处理器
type VerifyCodeHandler struct {
	verifyService *service.VerifyCodeService
}

// NewVerifyCodeHandler 创建验证码处理器实例
func NewVerifyCodeHandler() *VerifyCodeHandler {
	return &VerifyCodeHandler{
		verifyService: service.NewVerifyCodeService(),
	}
}

// SendCode 发送验证码
// @Summary 发送邮箱验证码
// @Tags Auth
// @Accept json
// @Param request body service.SendCodeRequest true "发送验证码请求"
// @Success 200 {object} response.Response
// @Router /api/v1/auth/send-code [post]
func (h *VerifyCodeHandler) SendCode(c *gin.Context) {
	var req service.SendCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	// 获取客户端 IP
	ip := c.ClientIP()

	if err := h.verifyService.SendCode(&req, ip); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// ============ 邀请相关 ============

// InviteHandler 邀请处理器
type InviteHandler struct {
	inviteService *service.InviteService
}

// NewInviteHandler 创建邀请处理器实例
func NewInviteHandler() *InviteHandler {
	return &InviteHandler{
		inviteService: service.NewInviteService(),
	}
}

// GetInviteInfo 获取邀请信息
// @Summary 获取我的邀请信息
// @Tags User
// @Success 200 {object} response.Response
// @Router /api/v1/user/invite [get]
func (h *InviteHandler) GetInviteInfo(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	// 获取基础 URL
	scheme := "https"
	if c.Request.TLS == nil {
		scheme = "http"
	}
	baseURL := scheme + "://" + c.Request.Host

	info, err := h.inviteService.GetInviteInfo(userID, baseURL)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, info)
}

// GetInviteRecords 获取邀请记录
// @Summary 获取我的邀请记录
// @Tags User
// @Param page query int false "页码"
// @Param page_size query int false "每页数量"
// @Success 200 {object} response.Response
// @Router /api/v1/user/invite/records [get]
func (h *InviteHandler) GetInviteRecords(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	records, total, err := h.inviteService.GetInviteRecords(userID, page, pageSize)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"list":      records,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// ============ 充值相关 ============

// RechargeHandler 充值处理器
type RechargeHandler struct {
	rechargeService *service.RechargeService
}

// NewRechargeHandler 创建充值处理器实例
func NewRechargeHandler() *RechargeHandler {
	return &RechargeHandler{
		rechargeService: service.NewRechargeService(),
	}
}

// RechargeByCode 使用卡密充值
// @Summary 使用卡密充值
// @Tags User
// @Accept json
// @Param request body service.RechargeByCodeRequest true "充值卡密"
// @Success 200 {object} response.Response
// @Router /api/v1/user/recharge [post]
func (h *RechargeHandler) RechargeByCode(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req service.RechargeByCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	amount, err := h.rechargeService.RechargeByCode(userID, req.Code)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"amount": amount,
	})
}

// ============ 管理员充值卡密管理 ============

// CreateRechargeCodes 批量创建充值卡密
// @Summary 批量创建充值卡密（管理员）
// @Tags Admin/Recharge
// @Accept json
// @Param request body service.CreateRechargeCodeRequest true "创建卡密请求"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/recharge/codes [post]
func (h *RechargeHandler) CreateRechargeCodes(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req service.CreateRechargeCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	codes, err := h.rechargeService.CreateRechargeCodes(&req, userID)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"codes": codes,
		"count": len(codes),
	})
}

// GetRechargeCodes 获取充值卡密列表
// @Summary 获取充值卡密列表（管理员）
// @Tags Admin/Recharge
// @Param page query int false "页码"
// @Param page_size query int false "每页数量"
// @Param used query bool false "是否已使用"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/recharge/codes [get]
func (h *RechargeHandler) GetRechargeCodes(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	var used *bool
	if usedStr := c.Query("used"); usedStr != "" {
		usedVal := usedStr == "true"
		used = &usedVal
	}

	codes, total, err := h.rechargeService.GetRechargeCodes(page, pageSize, used)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"list":      codes,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// DeleteRechargeCode 删除充值卡密
// @Summary 删除充值卡密（管理员）
// @Tags Admin/Recharge
// @Param id path int true "卡密ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/recharge/codes/{id} [delete]
func (h *RechargeHandler) DeleteRechargeCode(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.rechargeService.DeleteRechargeCode(uint(id)); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

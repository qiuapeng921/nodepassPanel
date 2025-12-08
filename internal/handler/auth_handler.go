package handler

import (
	"net/http"
	"nodepassPanel/internal/service"
	"nodepassPanel/pkg/response"

	"github.com/gin-gonic/gin"
)

// AuthHandler 认证处理器
type AuthHandler struct {
	authService *service.AuthService
}

// NewAuthHandler 创建认证处理器实例
func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		authService: service.NewAuthService(),
	}
}

// Register 用户注册
// @Summary 用户注册
// @Description 注册新用户账户
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body service.RegisterRequest true "注册信息"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response "参数错误"
// @Failure 500 {object} response.Response "注册失败"
// @Router /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req service.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.authService.Register(&req); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// Login 用户登录
// @Summary 用户登录
// @Description 使用邮箱和密码登录，获取 JWT Token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body service.LoginRequest true "登录信息"
// @Success 200 {object} response.Response{data=service.LoginResponse}
// @Failure 400 {object} response.Response "参数错误"
// @Failure 401 {object} response.Response "登录失败"
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req service.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	res, err := h.authService.Login(&req)
	if err != nil {
		response.Error(c, http.StatusUnauthorized, err.Error())
		return
	}

	response.Success(c, res)
}

// ResetPassword 重置密码
// @Summary 重置密码（找回密码）
// @Description 使用邮箱验证码重置密码
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body service.ResetPasswordRequest true "重置密码信息"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response "参数错误"
// @Router /auth/reset-password [post]
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req service.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.authService.ResetPassword(&req); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

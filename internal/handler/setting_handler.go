package handler

import (
	"net/http"
	"nodepassPanel/internal/service"
	"nodepassPanel/pkg/response"

	"github.com/gin-gonic/gin"
)

// SettingHandler 系统设置处理器
type SettingHandler struct {
	settingService *service.SettingService
}

// NewSettingHandler 创建设置处理器实例
func NewSettingHandler() *SettingHandler {
	return &SettingHandler{
		settingService: service.NewSettingService(),
	}
}

// ==================== 用户端接口 ====================

// GetPublic 获取公开设置
// @Summary 获取公开设置（站点名称、描述等）
// @Tags Setting
// @Success 200 {object} response.Response
// @Router /api/v1/settings [get]
func (h *SettingHandler) GetPublic(c *gin.Context) {
	settings, err := h.settingService.GetPublic()
	if err != nil {
		response.Fail(c, err.Error())
		return
	}
	response.Success(c, settings)
}

// ==================== 管理员接口 ====================

// GetAll 获取所有设置
// @Summary 获取所有设置（管理员）
// @Tags Admin/Setting
// @Success 200 {object} response.Response
// @Router /api/v1/admin/settings [get]
func (h *SettingHandler) GetAll(c *gin.Context) {
	settings, err := h.settingService.GetAll()
	if err != nil {
		response.Fail(c, err.Error())
		return
	}
	response.Success(c, settings)
}

// GetByGroup 获取分组设置
// @Summary 获取指定分组的设置（管理员）
// @Tags Admin/Setting
// @Param group path string true "分组名称"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/settings/group/{group} [get]
func (h *SettingHandler) GetByGroup(c *gin.Context) {
	group := c.Param("group")
	if group == "" {
		response.Error(c, http.StatusBadRequest, "group is required")
		return
	}

	settings, err := h.settingService.GetByGroup(group)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}
	response.Success(c, settings)
}

// SetRequest 单个设置请求
type SetRequest struct {
	Key   string `json:"key" binding:"required"`
	Value string `json:"value"`
}

// Set 设置单个值
// @Summary 设置单个值（管理员）
// @Tags Admin/Setting
// @Accept json
// @Param request body SetRequest true "设置信息"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/settings [post]
func (h *SettingHandler) Set(c *gin.Context) {
	var req SetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.settingService.Set(req.Key, req.Value); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// BatchUpdate 批量更新设置
// @Summary 批量更新设置（管理员）
// @Tags Admin/Setting
// @Accept json
// @Param request body service.BatchUpdateRequest true "设置列表"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/settings/batch [put]
func (h *SettingHandler) BatchUpdate(c *gin.Context) {
	var req service.BatchUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.settingService.BatchUpdate(&req); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// Delete 删除设置
// @Summary 删除设置（管理员）
// @Tags Admin/Setting
// @Param key path string true "设置键名"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/settings/{key} [delete]
func (h *SettingHandler) Delete(c *gin.Context) {
	key := c.Param("key")
	if key == "" {
		response.Error(c, http.StatusBadRequest, "key is required")
		return
	}

	if err := h.settingService.Delete(key); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

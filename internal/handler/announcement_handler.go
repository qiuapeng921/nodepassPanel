package handler

import (
	"net/http"
	"nodepassPanel/internal/service"
	"nodepassPanel/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
)

// AnnouncementHandler 公告处理器
type AnnouncementHandler struct {
	annService *service.AnnouncementService
}

// NewAnnouncementHandler 创建公告处理器实例
func NewAnnouncementHandler() *AnnouncementHandler {
	return &AnnouncementHandler{
		annService: service.NewAnnouncementService(),
	}
}

// ==================== 用户端接口 ====================

// List 获取公告列表（用户端）
// @Summary 获取已发布公告
// @Tags Announcement
// @Success 200 {object} response.Response
// @Router /api/v1/announcements [get]
func (h *AnnouncementHandler) List(c *gin.Context) {
	anns, err := h.annService.GetPublished()
	if err != nil {
		response.Fail(c, err.Error())
		return
	}
	response.Success(c, anns)
}

// GetPopups 获取弹窗公告
// @Summary 获取需要弹窗的公告
// @Tags Announcement
// @Success 200 {object} response.Response
// @Router /api/v1/announcements/popup [get]
func (h *AnnouncementHandler) GetPopups(c *gin.Context) {
	anns, err := h.annService.GetPopups()
	if err != nil {
		response.Fail(c, err.Error())
		return
	}
	response.Success(c, anns)
}

// ==================== 管理员接口 ====================

// AdminList 获取所有公告（管理员）
// @Summary 获取所有公告（包含草稿）
// @Tags Admin/Announcement
// @Success 200 {object} response.Response
// @Router /api/v1/admin/announcements [get]
func (h *AnnouncementHandler) AdminList(c *gin.Context) {
	anns, err := h.annService.GetAll()
	if err != nil {
		response.Fail(c, err.Error())
		return
	}
	response.Success(c, anns)
}

// Get 获取公告详情
// @Summary 获取公告详情（管理员）
// @Tags Admin/Announcement
// @Param id path int true "公告ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/announcements/{id} [get]
func (h *AnnouncementHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid announcement id")
		return
	}

	ann, err := h.annService.GetByID(uint(id))
	if err != nil {
		response.Error(c, http.StatusNotFound, "announcement not found")
		return
	}

	response.Success(c, ann)
}

// Create 创建公告
// @Summary 创建公告（管理员）
// @Tags Admin/Announcement
// @Accept json
// @Param request body service.CreateAnnouncementRequest true "公告信息"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/announcements [post]
func (h *AnnouncementHandler) Create(c *gin.Context) {
	var req service.CreateAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	ann, err := h.annService.Create(&req)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, ann)
}

// Update 更新公告
// @Summary 更新公告（管理员）
// @Tags Admin/Announcement
// @Accept json
// @Param id path int true "公告ID"
// @Param request body service.UpdateAnnouncementRequest true "公告信息"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/announcements/{id} [put]
func (h *AnnouncementHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid announcement id")
		return
	}

	var req service.UpdateAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	ann, err := h.annService.Update(uint(id), &req)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, ann)
}

// Delete 删除公告
// @Summary 删除公告（管理员）
// @Tags Admin/Announcement
// @Param id path int true "公告ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/announcements/{id} [delete]
func (h *AnnouncementHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid announcement id")
		return
	}

	if err := h.annService.Delete(uint(id)); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// Publish 发布公告
// @Summary 发布公告（管理员）
// @Tags Admin/Announcement
// @Param id path int true "公告ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/announcements/{id}/publish [post]
func (h *AnnouncementHandler) Publish(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid announcement id")
		return
	}

	if err := h.annService.Publish(uint(id)); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

// Offline 下线公告
// @Summary 下线公告（管理员）
// @Tags Admin/Announcement
// @Param id path int true "公告ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/announcements/{id}/offline [post]
func (h *AnnouncementHandler) Offline(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid announcement id")
		return
	}

	if err := h.annService.Offline(uint(id)); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

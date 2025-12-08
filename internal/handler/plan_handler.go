package handler

import (
	"net/http"
	"nodepassPanel/internal/service"
	"nodepassPanel/pkg/response"
	"strconv"

	"github.com/gin-gonic/gin"
)

// PlanHandler 套餐处理器
type PlanHandler struct {
	planService *service.PlanService
}

// NewPlanHandler 创建套餐处理器实例
func NewPlanHandler() *PlanHandler {
	return &PlanHandler{
		planService: service.NewPlanService(),
	}
}

// List 获取套餐列表（用户端）
// @Summary 获取可见套餐列表
// @Tags Plan
// @Success 200 {object} response.Response
// @Router /api/v1/plans [get]
func (h *PlanHandler) List(c *gin.Context) {
	plans, err := h.planService.GetVisible()
	if err != nil {
		response.Fail(c, "failed to get plans")
		return
	}
	response.Success(c, plans)
}

// AdminList 获取所有套餐列表（管理员）
// @Summary 获取所有套餐列表（包含隐藏）
// @Tags Admin/Plan
// @Success 200 {object} response.Response
// @Router /api/v1/admin/plans [get]
func (h *PlanHandler) AdminList(c *gin.Context) {
	plans, err := h.planService.GetAll()
	if err != nil {
		response.Fail(c, "failed to get plans")
		return
	}
	response.Success(c, plans)
}

// Get 获取套餐详情
// @Summary 获取套餐详情
// @Tags Admin/Plan
// @Param id path int true "套餐ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/plans/{id} [get]
func (h *PlanHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid plan id")
		return
	}

	plan, err := h.planService.GetByID(uint(id))
	if err != nil {
		response.Error(c, http.StatusNotFound, "plan not found")
		return
	}

	response.Success(c, plan)
}

// Create 创建套餐
// @Summary 创建新套餐
// @Tags Admin/Plan
// @Accept json
// @Param request body service.CreatePlanRequest true "套餐信息"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/plans [post]
func (h *PlanHandler) Create(c *gin.Context) {
	var req service.CreatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	plan, err := h.planService.Create(&req)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, plan)
}

// Update 更新套餐
// @Summary 更新套餐
// @Tags Admin/Plan
// @Accept json
// @Param id path int true "套餐ID"
// @Param request body service.UpdatePlanRequest true "套餐信息"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/plans/{id} [put]
func (h *PlanHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid plan id")
		return
	}

	var req service.UpdatePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	plan, err := h.planService.Update(uint(id), &req)
	if err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, plan)
}

// Delete 删除套餐
// @Summary 删除套餐
// @Tags Admin/Plan
// @Param id path int true "套餐ID"
// @Success 200 {object} response.Response
// @Router /api/v1/admin/plans/{id} [delete]
func (h *PlanHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "invalid plan id")
		return
	}

	if err := h.planService.Delete(uint(id)); err != nil {
		response.Fail(c, err.Error())
		return
	}

	response.Success(c, nil)
}

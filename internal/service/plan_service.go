package service

import (
	"errors"
	"nodepassPanel/internal/model"
	"nodepassPanel/internal/repository"
)

// PlanService 套餐服务层
type PlanService struct {
	planRepo *repository.PlanRepository
}

// NewPlanService 创建套餐服务实例
func NewPlanService() *PlanService {
	return &PlanService{
		planRepo: repository.NewPlanRepository(),
	}
}

// CreatePlanRequest 创建套餐请求
type CreatePlanRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Price       float64 `json:"price" binding:"gte=0"`
	Duration    int     `json:"duration" binding:"required,gt=0"` // 有效期(天)
	Transfer    int64   `json:"transfer" binding:"gte=0"`         // 流量限制(GB)
	SpeedLimit  int     `json:"speed_limit" binding:"gte=0"`      // 速度限制(Mbps)
	DeviceLimit int     `json:"device_limit" binding:"gte=0"`     // 设备数限制
	GroupID     int     `json:"group_id"`                         // 用户组
	Hidden      bool    `json:"hidden"`                           // 是否隐藏
	Sort        int     `json:"sort"`                             // 排序权重
}

// UpdatePlanRequest 更新套餐请求
type UpdatePlanRequest struct {
	Name        *string  `json:"name"`
	Description *string  `json:"description"`
	Price       *float64 `json:"price" binding:"omitempty,gte=0"`
	Duration    *int     `json:"duration" binding:"omitempty,gt=0"`
	Transfer    *int64   `json:"transfer" binding:"omitempty,gte=0"`
	SpeedLimit  *int     `json:"speed_limit" binding:"omitempty,gte=0"`
	DeviceLimit *int     `json:"device_limit" binding:"omitempty,gte=0"`
	GroupID     *int     `json:"group_id"`
	Hidden      *bool    `json:"hidden"`
	Sort        *int     `json:"sort"`
}

// PlanResponse 套餐响应
type PlanResponse struct {
	ID          uint    `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Duration    int     `json:"duration"`
	Transfer    int64   `json:"transfer"`
	SpeedLimit  int     `json:"speed_limit"`
	DeviceLimit int     `json:"device_limit"`
	GroupID     int     `json:"group_id"`
	Hidden      bool    `json:"hidden"`
	Sort        int     `json:"sort"`
}

// Create 创建套餐
func (s *PlanService) Create(req *CreatePlanRequest) (*model.Plan, error) {
	plan := &model.Plan{
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Duration:    req.Duration,
		Transfer:    req.Transfer,
		SpeedLimit:  req.SpeedLimit,
		DeviceLimit: req.DeviceLimit,
		GroupID:     req.GroupID,
		Hidden:      req.Hidden,
		Sort:        req.Sort,
	}

	if err := s.planRepo.Create(plan); err != nil {
		return nil, err
	}

	return plan, nil
}

// GetByID 根据ID获取套餐
func (s *PlanService) GetByID(id uint) (*model.Plan, error) {
	return s.planRepo.GetByID(id)
}

// GetAll 获取所有套餐（管理员）
func (s *PlanService) GetAll() ([]model.Plan, error) {
	return s.planRepo.GetAll()
}

// GetVisible 获取可见套餐（用户端）
func (s *PlanService) GetVisible() ([]model.Plan, error) {
	return s.planRepo.GetVisible()
}

// Update 更新套餐
func (s *PlanService) Update(id uint, req *UpdatePlanRequest) (*model.Plan, error) {
	plan, err := s.planRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("plan not found")
	}

	// 更新非空字段
	if req.Name != nil {
		plan.Name = *req.Name
	}
	if req.Description != nil {
		plan.Description = *req.Description
	}
	if req.Price != nil {
		plan.Price = *req.Price
	}
	if req.Duration != nil {
		plan.Duration = *req.Duration
	}
	if req.Transfer != nil {
		plan.Transfer = *req.Transfer
	}
	if req.SpeedLimit != nil {
		plan.SpeedLimit = *req.SpeedLimit
	}
	if req.DeviceLimit != nil {
		plan.DeviceLimit = *req.DeviceLimit
	}
	if req.GroupID != nil {
		plan.GroupID = *req.GroupID
	}
	if req.Hidden != nil {
		plan.Hidden = *req.Hidden
	}
	if req.Sort != nil {
		plan.Sort = *req.Sort
	}

	if err := s.planRepo.Update(plan); err != nil {
		return nil, err
	}

	return plan, nil
}

// Delete 删除套餐
func (s *PlanService) Delete(id uint) error {
	if !s.planRepo.ExistsByID(id) {
		return errors.New("plan not found")
	}
	return s.planRepo.Delete(id)
}

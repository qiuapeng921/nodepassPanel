package repository

import (
	"nodepassPanel/internal/global"
	"nodepassPanel/internal/model"
)

// PlanRepository 套餐数据访问层
type PlanRepository struct{}

// NewPlanRepository 创建套餐仓库实例
func NewPlanRepository() *PlanRepository {
	return &PlanRepository{}
}

// Create 创建套餐
func (r *PlanRepository) Create(plan *model.Plan) error {
	return global.DB.Create(plan).Error
}

// GetByID 根据ID获取套餐
func (r *PlanRepository) GetByID(id uint) (*model.Plan, error) {
	var plan model.Plan
	err := global.DB.First(&plan, id).Error
	return &plan, err
}

// GetAll 获取所有套餐
func (r *PlanRepository) GetAll() ([]model.Plan, error) {
	var plans []model.Plan
	err := global.DB.Order("sort DESC, id ASC").Find(&plans).Error
	return plans, err
}

// GetVisible 获取可见套餐（用户端）
func (r *PlanRepository) GetVisible() ([]model.Plan, error) {
	var plans []model.Plan
	err := global.DB.Where("hidden = ?", false).Order("sort DESC, id ASC").Find(&plans).Error
	return plans, err
}

// Update 更新套餐
func (r *PlanRepository) Update(plan *model.Plan) error {
	return global.DB.Save(plan).Error
}

// Delete 删除套餐
func (r *PlanRepository) Delete(id uint) error {
	return global.DB.Delete(&model.Plan{}, id).Error
}

// ExistsByID 检查套餐是否存在
func (r *PlanRepository) ExistsByID(id uint) bool {
	var count int64
	global.DB.Model(&model.Plan{}).Where("id = ?", id).Count(&count)
	return count > 0
}

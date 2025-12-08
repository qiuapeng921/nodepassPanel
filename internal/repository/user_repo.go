package repository

import (
	"nodepassPanel/internal/global"
	"nodepassPanel/internal/model"
)

type UserRepository struct{}

func NewUserRepository() *UserRepository {
	return &UserRepository{}
}

// Create 创建用户
func (r *UserRepository) Create(user *model.User) error {
	return global.DB.Create(user).Error
}

// GetByEmail 根据邮箱获取用户
func (r *UserRepository) GetByEmail(email string) (*model.User, error) {
	var user model.User
	err := global.DB.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetByID 根据 ID 获取用户
func (r *UserRepository) GetByID(id uint) (*model.User, error) {
	var user model.User
	err := global.DB.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// EmailExists 检查邮箱是否存在
func (r *UserRepository) EmailExists(email string) bool {
	var count int64
	global.DB.Model(&model.User{}).Where("email = ?", email).Count(&count)
	return count > 0
}

// Update 更新用户
func (r *UserRepository) Update(user *model.User) error {
	return global.DB.Save(user).Error
}

// Delete 删除用户
func (r *UserRepository) Delete(id uint) error {
	return global.DB.Delete(&model.User{}, id).Error
}

// GetAll 获取所有用户
func (r *UserRepository) GetAll() ([]model.User, error) {
	var users []model.User
	err := global.DB.Find(&users).Error
	return users, err
}

// GetPaginated 分页获取用户
func (r *UserRepository) GetPaginated(page, pageSize int, search string) ([]model.User, int64, error) {
	var users []model.User
	var total int64

	query := global.DB.Model(&model.User{})

	// 搜索条件
	if search != "" {
		query = query.Where("email LIKE ? OR invite_code LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("id DESC").Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

// GetByUUID 根据 UUID 获取用户
func (r *UserRepository) GetByUUID(uuid string) (*model.User, error) {
	var user model.User
	err := global.DB.Where("uuid = ?", uuid).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetByInviteCode 根据邀请码获取用户
func (r *UserRepository) GetByInviteCode(code string) (*model.User, error) {
	var user model.User
	err := global.DB.Where("invite_code = ?", code).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// CountByInviter 统计指定用户邀请的人数
func (r *UserRepository) CountByInviter(inviterID uint) int64 {
	var count int64
	global.DB.Model(&model.User{}).Where("invited_by = ?", inviterID).Count(&count)
	return count
}

// ==================== 批量操作 ====================

// BatchUpdateStatus 批量更新用户状态
func (r *UserRepository) BatchUpdateStatus(ids []uint, status int) (int64, error) {
	result := global.DB.Model(&model.User{}).Where("id IN ?", ids).Update("status", status)
	return result.RowsAffected, result.Error
}

// BatchAddBalance 批量充值
func (r *UserRepository) BatchAddBalance(ids []uint, amount float64) (int64, error) {
	result := global.DB.Model(&model.User{}).Where("id IN ?", ids).
		Update("balance", global.DB.Raw("balance + ?", amount))
	return result.RowsAffected, result.Error
}

// BatchDelete 批量删除用户
func (r *UserRepository) BatchDelete(ids []uint) (int64, error) {
	result := global.DB.Where("id IN ?", ids).Delete(&model.User{})
	return result.RowsAffected, result.Error
}

// BatchResetTraffic 批量重置流量
func (r *UserRepository) BatchResetTraffic(ids []uint) (int64, error) {
	result := global.DB.Model(&model.User{}).Where("id IN ?", ids).
		Updates(map[string]interface{}{"upload": 0, "download": 0})
	return result.RowsAffected, result.Error
}

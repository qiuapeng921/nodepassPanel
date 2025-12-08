package repository

import (
	"nodepassPanel/internal/global"
	"nodepassPanel/internal/model"
)

// SettingRepository 系统设置数据访问层
type SettingRepository struct{}

// NewSettingRepository 创建设置仓库实例
func NewSettingRepository() *SettingRepository {
	return &SettingRepository{}
}

// Get 获取单个设置
func (r *SettingRepository) Get(key string) (*model.Setting, error) {
	var setting model.Setting
	err := global.DB.Where("key = ?", key).First(&setting).Error
	return &setting, err
}

// GetByGroup 获取指定分组的设置
func (r *SettingRepository) GetByGroup(group string) ([]model.Setting, error) {
	var settings []model.Setting
	err := global.DB.Where("`group` = ?", group).Find(&settings).Error
	return settings, err
}

// GetAll 获取所有设置
func (r *SettingRepository) GetAll() ([]model.Setting, error) {
	var settings []model.Setting
	err := global.DB.Find(&settings).Error
	return settings, err
}

// GetPublic 获取公开设置（用户端）
func (r *SettingRepository) GetPublic() ([]model.Setting, error) {
	var settings []model.Setting
	// 只返回站点相关的公开设置
	err := global.DB.Where("`group` = ?", model.SettingGroupSite).Find(&settings).Error
	return settings, err
}

// Set 设置单个值（创建或更新）
func (r *SettingRepository) Set(key, value, valueType, group, desc string) error {
	var setting model.Setting
	result := global.DB.Where("key = ?", key).First(&setting)

	if result.Error != nil {
		// 不存在，创建新的
		setting = model.Setting{
			Key:   key,
			Value: value,
			Type:  valueType,
			Group: group,
			Desc:  desc,
		}
		return global.DB.Create(&setting).Error
	}

	// 存在，更新
	setting.Value = value
	if valueType != "" {
		setting.Type = valueType
	}
	if group != "" {
		setting.Group = group
	}
	if desc != "" {
		setting.Desc = desc
	}
	return global.DB.Save(&setting).Error
}

// BatchSet 批量设置
func (r *SettingRepository) BatchSet(settings map[string]string) error {
	for key, value := range settings {
		if err := r.Set(key, value, "string", "", ""); err != nil {
			return err
		}
	}
	return nil
}

// Delete 删除设置
func (r *SettingRepository) Delete(key string) error {
	return global.DB.Where("key = ?", key).Delete(&model.Setting{}).Error
}

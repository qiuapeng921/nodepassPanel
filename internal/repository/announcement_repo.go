package repository

import (
	"nodepassPanel/internal/global"
	"nodepassPanel/internal/model"
	"time"
)

// AnnouncementRepository 公告数据访问层
type AnnouncementRepository struct{}

// NewAnnouncementRepository 创建公告仓库实例
func NewAnnouncementRepository() *AnnouncementRepository {
	return &AnnouncementRepository{}
}

// Create 创建公告
func (r *AnnouncementRepository) Create(ann *model.Announcement) error {
	return global.DB.Create(ann).Error
}

// GetByID 根据ID获取公告
func (r *AnnouncementRepository) GetByID(id uint) (*model.Announcement, error) {
	var ann model.Announcement
	err := global.DB.First(&ann, id).Error
	return &ann, err
}

// GetAll 获取所有公告（管理员）
func (r *AnnouncementRepository) GetAll() ([]model.Announcement, error) {
	var anns []model.Announcement
	err := global.DB.Order("priority DESC, id DESC").Find(&anns).Error
	return anns, err
}

// GetPublished 获取已发布的公告（用户端）
func (r *AnnouncementRepository) GetPublished() ([]model.Announcement, error) {
	var anns []model.Announcement
	now := time.Now()
	err := global.DB.Where("status = ?", model.AnnouncementStatusPublished).
		Where("published_at IS NULL OR published_at <= ?", now).
		Where("expired_at IS NULL OR expired_at > ?", now).
		Order("priority DESC, id DESC").
		Find(&anns).Error
	return anns, err
}

// GetPopupAnnouncements 获取需要弹窗的公告
func (r *AnnouncementRepository) GetPopupAnnouncements() ([]model.Announcement, error) {
	var anns []model.Announcement
	now := time.Now()
	err := global.DB.Where("status = ? AND popup = ?", model.AnnouncementStatusPublished, true).
		Where("published_at IS NULL OR published_at <= ?", now).
		Where("expired_at IS NULL OR expired_at > ?", now).
		Order("priority DESC, id DESC").
		Find(&anns).Error
	return anns, err
}

// Update 更新公告
func (r *AnnouncementRepository) Update(ann *model.Announcement) error {
	return global.DB.Save(ann).Error
}

// Delete 删除公告
func (r *AnnouncementRepository) Delete(id uint) error {
	return global.DB.Delete(&model.Announcement{}, id).Error
}

// ExistsByID 检查公告是否存在
func (r *AnnouncementRepository) ExistsByID(id uint) bool {
	var count int64
	global.DB.Model(&model.Announcement{}).Where("id = ?", id).Count(&count)
	return count > 0
}

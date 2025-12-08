package service

import (
	"errors"
	"nodepassPanel/internal/model"
	"nodepassPanel/internal/repository"
	"time"
)

// AnnouncementService 公告服务层
type AnnouncementService struct {
	annRepo *repository.AnnouncementRepository
}

// NewAnnouncementService 创建公告服务实例
func NewAnnouncementService() *AnnouncementService {
	return &AnnouncementService{
		annRepo: repository.NewAnnouncementRepository(),
	}
}

// CreateAnnouncementRequest 创建公告请求
type CreateAnnouncementRequest struct {
	Title       string     `json:"title" binding:"required"`
	Content     string     `json:"content" binding:"required"`
	Tags        string     `json:"tags"`
	Priority    int        `json:"priority"`
	Popup       bool       `json:"popup"`
	Status      int        `json:"status"`
	PublishedAt *time.Time `json:"published_at"`
	ExpiredAt   *time.Time `json:"expired_at"`
}

// UpdateAnnouncementRequest 更新公告请求
type UpdateAnnouncementRequest struct {
	Title       *string    `json:"title"`
	Content     *string    `json:"content"`
	Tags        *string    `json:"tags"`
	Priority    *int       `json:"priority"`
	Popup       *bool      `json:"popup"`
	Status      *int       `json:"status"`
	PublishedAt *time.Time `json:"published_at"`
	ExpiredAt   *time.Time `json:"expired_at"`
}

// Create 创建公告
func (s *AnnouncementService) Create(req *CreateAnnouncementRequest) (*model.Announcement, error) {
	ann := &model.Announcement{
		Title:       req.Title,
		Content:     req.Content,
		Tags:        req.Tags,
		Priority:    req.Priority,
		Popup:       req.Popup,
		Status:      req.Status,
		PublishedAt: req.PublishedAt,
		ExpiredAt:   req.ExpiredAt,
	}

	if err := s.annRepo.Create(ann); err != nil {
		return nil, err
	}

	return ann, nil
}

// GetByID 根据ID获取公告
func (s *AnnouncementService) GetByID(id uint) (*model.Announcement, error) {
	return s.annRepo.GetByID(id)
}

// GetAll 获取所有公告（管理员）
func (s *AnnouncementService) GetAll() ([]model.Announcement, error) {
	return s.annRepo.GetAll()
}

// GetPublished 获取已发布的公告（用户端）
func (s *AnnouncementService) GetPublished() ([]model.Announcement, error) {
	return s.annRepo.GetPublished()
}

// GetPopups 获取需要弹窗的公告
func (s *AnnouncementService) GetPopups() ([]model.Announcement, error) {
	return s.annRepo.GetPopupAnnouncements()
}

// Update 更新公告
func (s *AnnouncementService) Update(id uint, req *UpdateAnnouncementRequest) (*model.Announcement, error) {
	ann, err := s.annRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("announcement not found")
	}

	// 更新非空字段
	if req.Title != nil {
		ann.Title = *req.Title
	}
	if req.Content != nil {
		ann.Content = *req.Content
	}
	if req.Tags != nil {
		ann.Tags = *req.Tags
	}
	if req.Priority != nil {
		ann.Priority = *req.Priority
	}
	if req.Popup != nil {
		ann.Popup = *req.Popup
	}
	if req.Status != nil {
		ann.Status = *req.Status
	}
	if req.PublishedAt != nil {
		ann.PublishedAt = req.PublishedAt
	}
	if req.ExpiredAt != nil {
		ann.ExpiredAt = req.ExpiredAt
	}

	if err := s.annRepo.Update(ann); err != nil {
		return nil, err
	}

	return ann, nil
}

// Delete 删除公告
func (s *AnnouncementService) Delete(id uint) error {
	if !s.annRepo.ExistsByID(id) {
		return errors.New("announcement not found")
	}
	return s.annRepo.Delete(id)
}

// Publish 发布公告
func (s *AnnouncementService) Publish(id uint) error {
	ann, err := s.annRepo.GetByID(id)
	if err != nil {
		return errors.New("announcement not found")
	}

	now := time.Now()
	ann.Status = model.AnnouncementStatusPublished
	ann.PublishedAt = &now

	return s.annRepo.Update(ann)
}

// Offline 下线公告
func (s *AnnouncementService) Offline(id uint) error {
	ann, err := s.annRepo.GetByID(id)
	if err != nil {
		return errors.New("announcement not found")
	}

	ann.Status = model.AnnouncementStatusOffline

	return s.annRepo.Update(ann)
}

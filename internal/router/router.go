package router

import (
	"nodepassPanel/internal/config"
	"nodepassPanel/internal/handler"
	"nodepassPanel/internal/middleware"
	"nodepassPanel/pkg/response"

	_ "nodepassPanel/docs" // swagger docs

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"golang.org/x/time/rate"
)

// InitRouter 初始化路由
func InitRouter() *gin.Engine {
	if config.App.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// 基础中间件
	r.Use(gin.Recovery())             // 恢复 panic
	r.Use(middleware.CORS())          // CORS 跨域
	r.Use(middleware.RequestLogger()) // 结构化日志

	// 全局限流：每秒 100 个请求，突发 200
	globalLimiter := middleware.NewRateLimiter(rate.Limit(100), 200)
	r.Use(middleware.RateLimiter(globalLimiter))

	// Swagger 文档
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		response.Success(c, gin.H{"status": "ok", "version": "0.1.0"})
	})

	// API 路由组
	api := r.Group("/api/v1")

	{
		// ==================== 公开路由 ====================
		// 认证
		authHandler := handler.NewAuthHandler()
		verifyHandler := handler.NewVerifyCodeHandler()
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/send-code", verifyHandler.SendCode)         // 发送验证码
			auth.POST("/reset-password", authHandler.ResetPassword) // 重置密码
		}

		// 公开套餐列表
		planHandler := handler.NewPlanHandler()
		api.GET("/plans", planHandler.List)

		// 公告（用户端）
		annHandler := handler.NewAnnouncementHandler()
		api.GET("/announcements", annHandler.List)
		api.GET("/announcements/popup", annHandler.GetPopups)

		// 系统设置（公开）
		settingHandler := handler.NewSettingHandler()
		api.GET("/settings", settingHandler.GetPublic)

		// 支付回调
		paymentHandler := handler.NewPaymentHandler()
		api.Any("/payment/notify/:method", paymentHandler.Notify)

		// WebSocket
		wsHandler := handler.NewWSHandler()
		api.GET("/ws", wsHandler.Connect)

		// ==================== 订阅路由 (依靠 Token 验证) ====================

		subHandler := handler.NewSubscribeHandler()
		api.GET("/client/subscribe/:token", subHandler.Subscribe)

		// ==================== 需要登录的路由 ====================
		user := api.Group("/user")
		user.Use(middleware.JWTAuth())
		{
			// 用户个人信息
			userHandler := handler.NewUserHandler()
			user.GET("/profile", userHandler.GetProfile)
			user.PUT("/password", userHandler.ChangePassword)
			user.GET("/traffic", userHandler.GetTrafficStats)
			user.POST("/subscribe/reset", userHandler.ResetSubscribeToken)

			// 节点列表 (用户可见节点)
			nodeHandler := handler.NewNodeHandler()
			user.GET("/nodes", nodeHandler.ListNodes)

			// 订单
			orderHandler := handler.NewOrderHandler()
			user.GET("/orders", orderHandler.List)
			user.GET("/orders/:id", orderHandler.Get)
			user.POST("/orders", orderHandler.Create)
			user.POST("/orders/:id/cancel", orderHandler.Cancel)

			// 邀请系统
			inviteHandler := handler.NewInviteHandler()
			user.GET("/invite", inviteHandler.GetInviteInfo)
			user.GET("/invite/records", inviteHandler.GetInviteRecords)

			// 充值
			// 充值
			rechargeHandler := handler.NewRechargeHandler()
			user.POST("/recharge", rechargeHandler.RechargeByCode)
			user.POST("/recharge/online", rechargeHandler.CreateOnlineRecharge)

			// 优惠券
			couponHandler := handler.NewCouponHandler()
			user.POST("/coupons/verify", couponHandler.Verify)

			// 支付
			// paymentHandler initialized above? No, it's local scope in public block.
			// Re-initialize or move up? Re-initialize is fine (stateless).
			payHandler := handler.NewPaymentHandler()
			user.POST("/payment/pay", payHandler.Pay)
		}

		// ==================== 管理员路由 ====================
		admin := api.Group("/admin")
		admin.Use(middleware.JWTAuth(), middleware.AdminRequired())
		{
			// 用户管理
			userHandler := handler.NewUserHandler()
			admin.GET("/users", userHandler.AdminList)
			admin.GET("/users/:id", userHandler.AdminGet)
			admin.PUT("/users/:id", userHandler.AdminUpdate)
			admin.DELETE("/users/:id", userHandler.AdminDelete)
			admin.POST("/users/:id/reset-traffic", userHandler.AdminResetTraffic)
			admin.POST("/users/:id/charge", userHandler.AdminCharge)
			admin.POST("/users/:id/ban", userHandler.AdminBan)
			admin.POST("/users/:id/unban", userHandler.AdminUnban)
			// 批量操作
			admin.POST("/users/batch/ban", userHandler.BatchBan)
			admin.POST("/users/batch/unban", userHandler.BatchUnban)
			admin.POST("/users/batch/charge", userHandler.BatchCharge)
			admin.POST("/users/batch/delete", userHandler.BatchDelete)
			admin.POST("/users/batch/reset-traffic", userHandler.BatchResetTraffic)

			// 节点管理
			nodeHandler := handler.NewNodeHandler()
			admin.GET("/nodes", nodeHandler.ListNodes) // 管理员查看所有节点
			admin.GET("/nodes/:id", nodeHandler.Get)
			admin.POST("/nodes", nodeHandler.AddNode)
			admin.PUT("/nodes/:id", nodeHandler.Update)
			admin.DELETE("/nodes/:id", nodeHandler.Delete)
			admin.POST("/nodes/:id/ping", nodeHandler.TestNode)
			admin.POST("/nodes/:id/refresh", nodeHandler.Refresh)

			// 套餐管理
			admin.GET("/plans", planHandler.AdminList)
			admin.GET("/plans/:id", planHandler.Get)
			admin.POST("/plans", planHandler.Create)
			admin.PUT("/plans/:id", planHandler.Update)
			admin.DELETE("/plans/:id", planHandler.Delete)

			// 公告管理
			annHandler := handler.NewAnnouncementHandler()
			admin.GET("/announcements", annHandler.AdminList)
			admin.GET("/announcements/:id", annHandler.Get)
			admin.POST("/announcements", annHandler.Create)
			admin.PUT("/announcements/:id", annHandler.Update)
			admin.DELETE("/announcements/:id", annHandler.Delete)
			admin.POST("/announcements/:id/publish", annHandler.Publish)
			admin.POST("/announcements/:id/offline", annHandler.Offline)

			// 系统设置
			settingHandler := handler.NewSettingHandler()
			admin.GET("/settings", settingHandler.GetAll)
			admin.GET("/settings/group/:group", settingHandler.GetByGroup)
			admin.POST("/settings", settingHandler.Set)
			admin.PUT("/settings/batch", settingHandler.BatchUpdate)
			admin.DELETE("/settings/:key", settingHandler.Delete)

			// 订单管理
			orderHandler := handler.NewOrderHandler()
			admin.GET("/orders", orderHandler.AdminList)
			admin.GET("/orders/:id", orderHandler.AdminGet)
			admin.POST("/orders/:id/paid", orderHandler.MarkPaid)
			admin.POST("/orders/:id/refund", orderHandler.Refund)
			admin.DELETE("/orders/:id", orderHandler.Delete)

			// 充值卡密管理
			rechargeHandler := handler.NewRechargeHandler()
			admin.GET("/recharge/codes", rechargeHandler.GetRechargeCodes)
			admin.POST("/recharge/codes", rechargeHandler.CreateRechargeCodes)
			admin.DELETE("/recharge/codes/:id", rechargeHandler.DeleteRechargeCode)

			// 优惠券管理
			couponHandler := handler.NewCouponHandler()
			admin.GET("/coupons", couponHandler.GetList)
			admin.POST("/coupons", couponHandler.Create)
			admin.PUT("/coupons/:id", couponHandler.Update)
			admin.DELETE("/coupons/:id", couponHandler.Delete)
		}

	}

	return r
}

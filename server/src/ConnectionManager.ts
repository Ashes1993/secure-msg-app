import { WebSocket } from "ws";

export class ConnectionManager {
  private userSockets = new Map<string, WebSocket>();
  private roomParticipants = new Map<string, Set<string>>();

  public registerConnection(userId: string, socket: WebSocket): void {
    this.userSockets.set(userId, socket);
  }

  public joinRoom(roomId: string, userId: string): void {
    if (!this.roomParticipants.has(roomId)) {
      this.roomParticipants.set(roomId, new Set<string>());
    }

    this.roomParticipants.get(roomId)?.add(userId);
  }

  public leaveRoom(roomId: string, userId: string): void {
    const participants = this.roomParticipants.get(roomId);
    if (!participants) return;
    participants?.delete(userId);

    if (participants.size === 0) {
      this.roomParticipants.delete(roomId);
    }
  }

  public removeConnection(userId: string): void {
    this.userSockets.delete(userId);
  }

  public startHeartbeatSentinel(intervalMs: number = 30000): NodeJS.Timeout {
    return setInterval(() => {
      this.userSockets.forEach((socket, userId) => {
        if (!socket.isAlive) {
          socket.terminate();
          this.removeConnection(userId);
          return;
        }

        socket.isAlive = false;
        socket.ping();
      });
    }, intervalMs);
  }
}

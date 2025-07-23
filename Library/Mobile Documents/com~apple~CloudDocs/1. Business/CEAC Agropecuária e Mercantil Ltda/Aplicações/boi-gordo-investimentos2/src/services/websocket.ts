import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string): void {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    
    this.socket = io(socketUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket conectado');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket desconectado:', reason);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexão WebSocket:', error);
      this.isConnecting = false;
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconectado após ${attemptNumber} tentativas`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Erro de reconexão WebSocket:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  // Subscription methods
  subscribeToPositions(callback: (positions: any[]) => void): void {
    this.callbacks.positions = callback;
    this.socket.on('positions:updated', callback);
  }

  unsubscribeFromPositions(): void {
    this.callbacks.positions = null;
    this.socket.off('positions:updated');
  }

  subscribeToOptions(callback: (options: any[]) => void): void {
    this.callbacks.options = callback;
    this.socket.on('options:updated', callback);
  }

  unsubscribeFromOptions(): void {
    this.callbacks.options = null;
    this.socket.off('options:updated');
  }

  subscribeToPrices(callback: (prices: any[]) => void): void {
    this.callbacks.prices = callback;
    this.socket.on('prices:updated', callback);
  }

  unsubscribeFromPrices(): void {
    this.callbacks.prices = null;
    this.socket.off('prices:updated');
  }

  // Métodos utilitários
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  // Eventos específicos do sistema
  requestPriceSubscription(contracts: string[]): void {
    this.emit('subscribe:prices', { contracts });
  }

  requestPositionSubscription(): void {
    this.emit('subscribe:positions');
  }

  requestTransactionSubscription(): void {
    this.emit('subscribe:transactions');
  }

  requestOptionSubscription(): void {
    this.emit('subscribe:options');
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService; 
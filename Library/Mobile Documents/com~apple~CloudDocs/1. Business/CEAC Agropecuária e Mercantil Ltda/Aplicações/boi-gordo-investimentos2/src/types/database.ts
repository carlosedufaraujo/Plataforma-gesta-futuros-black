export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nome: string
          cpf: string
          email: string
          telefone: string | null
          endereco: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cpf: string
          email: string
          telefone?: string | null
          endereco?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cpf?: string
          email?: string
          telefone?: string | null
          endereco?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      brokerages: {
        Row: {
          id: string
          nome: string
          cnpj: string
          endereco: string | null
          assessor: string | null
          telefone: string | null
          email: string | null
          corretagem_milho: number
          corretagem_boi: number
          taxas: number
          impostos: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cnpj: string
          endereco?: string | null
          assessor?: string | null
          telefone?: string | null
          email?: string | null
          corretagem_milho?: number
          corretagem_boi?: number
          taxas?: number
          impostos?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cnpj?: string
          endereco?: string | null
          assessor?: string | null
          telefone?: string | null
          email?: string | null
          corretagem_milho?: number
          corretagem_boi?: number
          taxas?: number
          impostos?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_brokerages: {
        Row: {
          id: string
          user_id: string
          brokerage_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          brokerage_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          brokerage_id?: string
          role?: string
          created_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          symbol: string
          contract_type: string
          expiration_date: string
          contract_size: number
          unit: string
          name: string
          current_price: number | null
          volume: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          symbol: string
          contract_type: string
          expiration_date: string
          contract_size: number
          unit: string
          name: string
          current_price?: number | null
          volume?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          symbol?: string
          contract_type?: string
          expiration_date?: string
          contract_size?: number
          unit?: string
          name?: string
          current_price?: number | null
          volume?: number
          is_active?: boolean
          created_at?: string
        }
      }
      positions: {
        Row: {
          id: string
          user_id: string
          brokerage_id: string
          contract_id: string
          contract: string
          direction: string
          quantity: number
          entry_price: number
          current_price: number | null
          stop_loss: number | null
          take_profit: number | null
          status: string
          entry_date: string
          exit_date: string | null
          exit_price: number | null
          realized_pnl: number | null
          unrealized_pnl: number | null
          pnl_percentage: number | null
          exposure: number | null
          fees: number
          symbol: string | null
          name: string | null
          contract_size: number | null
          unit: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          brokerage_id: string
          contract_id: string
          contract: string
          direction: string
          quantity: number
          entry_price: number
          current_price?: number | null
          stop_loss?: number | null
          take_profit?: number | null
          status?: string
          entry_date?: string
          exit_date?: string | null
          exit_price?: number | null
          realized_pnl?: number | null
          unrealized_pnl?: number | null
          pnl_percentage?: number | null
          exposure?: number | null
          fees?: number
          symbol?: string | null
          name?: string | null
          contract_size?: number | null
          unit?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          brokerage_id?: string
          contract_id?: string
          contract?: string
          direction?: string
          quantity?: number
          entry_price?: number
          current_price?: number | null
          stop_loss?: number | null
          take_profit?: number | null
          status?: string
          entry_date?: string
          exit_date?: string | null
          exit_price?: number | null
          realized_pnl?: number | null
          unrealized_pnl?: number | null
          pnl_percentage?: number | null
          exposure?: number | null
          fees?: number
          symbol?: string | null
          name?: string | null
          contract_size?: number | null
          unit?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          brokerage_id: string
          position_id: string | null
          date: string
          type: string
          contract: string
          quantity: number
          price: number
          total: number
          fees: number
          status: string
          created_at: string
          custom_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          brokerage_id: string
          position_id?: string | null
          date?: string
          type: string
          contract: string
          quantity: number
          price: number
          total: number
          fees?: number
          status?: string
          created_at?: string
          custom_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          brokerage_id?: string
          position_id?: string | null
          date?: string
          type?: string
          contract?: string
          quantity?: number
          price?: number
          total?: number
          fees?: number
          status?: string
          created_at?: string
          custom_id?: string | null
        }
      }
      options: {
        Row: {
          id: string
          user_id: string
          brokerage_id: string
          contract_id: string
          option_type: string
          strike_price: number
          premium: number
          quantity: number
          expiration_date: string
          is_purchased: boolean
          status: string
          delta: number | null
          gamma: number | null
          theta: number | null
          vega: number | null
          symbol: string | null
          name: string | null
          fees: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          brokerage_id: string
          contract_id: string
          option_type: string
          strike_price: number
          premium: number
          quantity: number
          expiration_date: string
          is_purchased: boolean
          status?: string
          delta?: number | null
          gamma?: number | null
          theta?: number | null
          vega?: number | null
          symbol?: string | null
          name?: string | null
          fees?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          brokerage_id?: string
          contract_id?: string
          option_type?: string
          strike_price?: number
          premium?: number
          quantity?: number
          expiration_date?: string
          is_purchased?: boolean
          status?: string
          delta?: number | null
          gamma?: number | null
          theta?: number | null
          vega?: number | null
          symbol?: string | null
          name?: string | null
          fees?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 
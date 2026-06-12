import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const { items } = get()
        const existing = items.find(i => i.id === product.id)
        if (existing) {
          set({
            items: items.map(i =>
              i.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            )
          })
        } else {
          set({ items: [...items, { ...product, quantity }] })
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter(i => i.id !== productId) })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) return get().removeItem(productId)
        set({
          items: get().items.map(i =>
            i.id === productId ? { ...i, quantity } : i
          )
        })
      },

      clearCart: () => set({ items: [] }),

      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },

      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      },

      get groupedByVendor() {
        const groups = {}
        get().items.forEach(item => {
          const key = item.store_id
          if (!groups[key]) {
            groups[key] = { store_id: item.store_id, store_name: item.store_name, items: [] }
          }
          groups[key].items.push(item)
        })
        return Object.values(groups)
      }
    }),
    { name: 'marves-cart' }
  )
)

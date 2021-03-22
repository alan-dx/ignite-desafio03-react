import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

    const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      await api.get<Product[]>('products')
      .then(response => {
        const product = response.data.find((product: Product) => product.id === productId) as Product
        const producInCart = cart.find(product => productId === product.id)

        if (product) {
          if (producInCart) {
            updateProductAmount({productId, amount: producInCart.amount + 1})
          } else {
            product.amount = 1
            let newCart = [...cart, product]
            setCart(newCart)
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
          }
        } else {
          toast.error('Erro na adição do produto');
        }

      })
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter((product) => product.id !== productId)
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount > 0) {
        await api.get<Stock[]>('stock')
        .then((response) => {
          const {amount: amountStock} = response.data.find((productStock: Stock) => productId === productStock.id) as Stock
          
          if (amountStock >= amount && amount >= 1) {

            const newCart = cart.map((product) => {
      
              if (product.id === productId) {
                product.amount = amount
              }
      
              return product
            })
            
            setCart(newCart)
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
          
        })
      }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

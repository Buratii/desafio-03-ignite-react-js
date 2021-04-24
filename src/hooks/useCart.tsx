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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const validateProducts = updatedCart.find(product => product.id === productId);

      const { data } = await api.get<Stock>(`/stock/${productId}`);

      const currentAmount = validateProducts ? validateProducts.amount : 0;
      const amount = currentAmount + 1;

      if ( amount > data.amount ) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if ( validateProducts ) {
        validateProducts.amount = amount;

      } else {
        const { data } = await api.get(`/products/${productId}`);

        const newProduct = {
          ...data,
          amount: 1,
        }

        updatedCart.push(newProduct)
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const validateProducts = updatedCart.find(product => product.id === productId);

      if ( !validateProducts ) {
        toast.error('Erro na remoção do produto');
        return;
      }

      const filteredCart = updatedCart.filter(product => {
        return product.id !== productId
      });

      setCart(filteredCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredCart)); 

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updatedCart = [...cart];
      const validateProducts = updatedCart.find(product => product.id === productId);

      const { data } = await api.get<Stock>(`/stock/${productId}`);

      if ( amount > data.amount || amount < 1 ) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if ( validateProducts ) {
        validateProducts.amount = amount;
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart)); 

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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

export interface ProductRecord {
  id: string;
  productName: string;
  productDescription: string;
  price: number;
  category: string;
  imageUrl?: string;
  stockQuantity: number;
  ownerUserId: string;
  ownerBusinessName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormValues {
  productName: string;
  productDescription: string;
  price: string;
  category: string;
  imageUrl: string;
  stockQuantity: string;
}

export const emptyProductFormValues: ProductFormValues = {
  productName: '',
  productDescription: '',
  price: '',
  category: '',
  imageUrl: '',
  stockQuantity: '',
};
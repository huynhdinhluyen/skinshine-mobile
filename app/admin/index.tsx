import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	FlatList,
	Modal,
	TextInput,
	ScrollView,
	Alert,
	ToastAndroid,
	ActivityIndicator,
	ListRenderItemInfo,
	Platform,
	Image,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

// Define the base URL for your API
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Types for products and categories
interface Product {
	_id: string;
	name: string;
	brand: string;
	price: number;
	discountedPrice?: number;
	stockQuantity: number;
	sold?: number;
	description?: string;
	category: Category | string;
	promotionId?: string;
	capacity?: string;
	origin?: string;
	ingredients?: string[];
	skinTypes?: string[];
	images?: string[];
	averageRating?: number;
	reviewCount?: number;
	isActive: boolean;
	createdAt?: string;
	updatedAt?: string;
}

interface Category {
	_id: string;
	name: string;
	description?: string;
	isActive: boolean;
	createdAt?: string;
	updatedAt?: string;
}

interface ProductFormData {
	name: string;
	brand: string;
	price: string;
	stockQuantity: string;
	description: string;
	category: string;
	capacity: string;
	origin: string;
	ingredients: string;
	images: string;
}

interface CategoryFormData {
	name: string;
	description: string;
}

export default function AdminScreen() {
	const { user } = useAuth();
	const token = user?.token;

	const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
	const [products, setProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [productModalVisible, setProductModalVisible] = useState<boolean>(false);
	const [categoryModalVisible, setCategoryModalVisible] = useState<boolean>(false);
	const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
	const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

	// Product form state
	const [productForm, setProductForm] = useState<ProductFormData>({
		name: '',
		brand: '',
		price: '',
		stockQuantity: '',
		description: '',
		category: '',
		capacity: '',
		origin: '',
		ingredients: '',
		images: '',
	});

	// Category form state
	const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
		name: '',
		description: '',
	});

	useEffect(() => {
		if (token) {
			fetchProducts();
			fetchCategories();
		}
	}, [token]);

	// API Functions for Products
	const fetchProducts = async (): Promise<void> => {
		setIsLoading(true);
		try {
			const response = await axios.get(`${API_URL}/products`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			setProducts(response.data.data.data || []);
		} catch (error) {
			console.error('Error fetching products:', error);
			showToast('Không thể tải danh sách sản phẩm');
		} finally {
			setIsLoading(false);
		}
	};

	const showToast = (message: string): void => {
		if (Platform.OS === 'android') {
			ToastAndroid.show(message, ToastAndroid.SHORT);
		} else {
			Alert.alert('Thông báo', message);
		}
	};

	const createProduct = async (): Promise<void> => {
		try {
			if (
				!productForm.name ||
				!productForm.brand ||
				!productForm.price ||
				!productForm.stockQuantity ||
				!productForm.category
			) {
				showToast('Vui lòng điền đầy đủ thông tin bắt buộc');
				return;
			}

			// Convert numeric fields and prepare arrays
			const productData = {
				...productForm,
				price: parseFloat(productForm.price),
				stockQuantity: parseInt(productForm.stockQuantity),
				ingredients: productForm.ingredients
					? productForm.ingredients.split(',').map((item) => item.trim())
					: [],
				skinTypes: ['NORMAL'], // Default skin type
				images: productForm.images ? productForm.images.split(',').map((item) => item.trim()) : [], // Process images
			};

			const response = await axios.post(`${API_URL}/products`, productData, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			showToast('Tạo sản phẩm thành công');
			setProductModalVisible(false);
			resetProductForm();
			fetchProducts();
		} catch (error) {
			console.error('Error creating product:', error);
			showToast('Không thể tạo sản phẩm');
		}
	};

	const updateProduct = async (): Promise<void> => {
		try {
			if (!currentProduct?._id) return;

			// Only include fields that were changed
			const updateData: Partial<Record<keyof ProductFormData, any>> = {};
			Object.keys(productForm).forEach((key) => {
				const formKey = key as keyof ProductFormData;
				if (productForm[formKey] !== '') {
					if (formKey === 'price') {
						updateData[formKey] = parseFloat(productForm[formKey]);
					} else if (formKey === 'stockQuantity') {
						updateData[formKey] = parseInt(productForm[formKey]);
					} else if (formKey === 'ingredients' && productForm[formKey]) {
						updateData[formKey] = productForm[formKey].split(',').map((item) => item.trim());
					} else if (formKey === 'images' && productForm[formKey]) {
						updateData[formKey] = productForm[formKey].split(',').map((item) => item.trim());
					} else {
						updateData[formKey] = productForm[formKey];
					}
				}
			});

			await axios.patch(`${API_URL}/products/${currentProduct._id}`, updateData, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			showToast('Cập nhật sản phẩm thành công');
			setProductModalVisible(false);
			resetProductForm();
			fetchProducts();
		} catch (error) {
			console.error('Error updating product:', error);
			showToast('Không thể cập nhật sản phẩm');
		}
	};

	const deleteProduct = async (productId: string): Promise<void> => {
		try {
			await axios.delete(`${API_URL}/products/${productId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			showToast('Xóa sản phẩm thành công');
			fetchProducts();
		} catch (error) {
			console.error('Error deleting product:', error);
			showToast('Không thể xóa sản phẩm');
		}
	};

	// API Functions for Categories
	const fetchCategories = async (): Promise<void> => {
		setIsLoading(true);
		try {
			const response = await axios.get(`${API_URL}/categories`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			setCategories(response.data.data || []);
		} catch (error) {
			console.error('Error fetching categories:', error);
			showToast('Không thể tải danh sách danh mục');
		} finally {
			setIsLoading(false);
		}
	};

	const createCategory = async (): Promise<void> => {
		try {
			if (!categoryForm.name) {
				showToast('Vui lòng nhập tên danh mục');
				return;
			}

			await axios.post(`${API_URL}/categories`, categoryForm, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			showToast('Tạo danh mục thành công');
			setCategoryModalVisible(false);
			resetCategoryForm();
			fetchCategories();
		} catch (error) {
			console.error('Error creating category:', error);
			showToast('Không thể tạo danh mục');
		}
	};

	const updateCategory = async (): Promise<void> => {
		try {
			if (!currentCategory?._id) return;

			await axios.put(`${API_URL}/categories/${currentCategory._id}`, categoryForm, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			showToast('Cập nhật danh mục thành công');
			setCategoryModalVisible(false);
			resetCategoryForm();
			fetchCategories();
		} catch (error) {
			console.error('Error updating category:', error);
			showToast('Không thể cập nhật danh mục');
		}
	};

	const deleteCategory = async (categoryId: string): Promise<void> => {
		try {
			await axios.delete(`${API_URL}/categories/${categoryId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			showToast('Xóa danh mục thành công');
			fetchCategories();
		} catch (error) {
			console.error('Error deleting category:', error);
			showToast('Không thể xóa danh mục');
		}
	};

	// Form Helpers
	const resetProductForm = (): void => {
		setProductForm({
			name: '',
			brand: '',
			price: '',
			stockQuantity: '',
			description: '',
			category: '',
			capacity: '',
			origin: '',
			ingredients: '',
			images: '',
		});
		setCurrentProduct(null);
	};

	const resetCategoryForm = (): void => {
		setCategoryForm({
			name: '',
			description: '',
		});
		setCurrentCategory(null);
	};

	const openProductModal = (product: Product | null = null): void => {
		if (product) {
			setCurrentProduct(product);
			setProductForm({
				name: product.name || '',
				brand: product.brand || '',
				price: product.price?.toString() || '',
				stockQuantity: product.stockQuantity?.toString() || '',
				description: product.description || '',
				category: typeof product.category === 'object' ? product.category._id : product.category || '',
				capacity: product.capacity || '',
				origin: product.origin || '',
				ingredients: product.ingredients?.join(', ') || '',
				images: product.images?.join(', ') || '',
			});
		} else {
			resetProductForm();
		}
		setProductModalVisible(true);
	};

	const openCategoryModal = (category: Category | null = null): void => {
		if (category) {
			setCurrentCategory(category);
			setCategoryForm({
				name: category.name || '',
				description: category.description || '',
			});
		} else {
			resetCategoryForm();
		}
		setCategoryModalVisible(true);
	};

	// Render list items
	const renderProductItem = ({ item }: ListRenderItemInfo<Product>) => (
		<View style={styles.listItem}>
			{item.images && item.images.length > 0 && (
				<Image
					source={{ uri: item.images[0] }}
					style={styles.productImage}
					defaultSource={require('@/assets/images/favicon.png')}
				/>
			)}
			<View style={styles.listItemContent}>
				<Text style={styles.itemTitle}>{item.name}</Text>
				<Text>
					{item.brand} - {item.price.toLocaleString('vi-VN')}đ
				</Text>
				<Text numberOfLines={1}>{item.description}</Text>
			</View>
			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={[styles.actionButton, styles.editButton]}
					onPress={() => openProductModal(item)}
				>
					<Text style={styles.buttonText}>Sửa</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.actionButton, styles.deleteButton]}
					onPress={() =>
						Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa sản phẩm "${item.name}"?`, [
							{ text: 'Hủy', style: 'cancel' },
							{ text: 'Xóa', onPress: () => deleteProduct(item._id) },
						])
					}
				>
					<Text style={styles.buttonText}>Xóa</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	const renderCategoryItem = ({ item }: ListRenderItemInfo<Category>) => (
		<View style={styles.listItem}>
			<View style={styles.listItemContent}>
				<Text style={styles.itemTitle}>{item.name}</Text>
				<Text numberOfLines={1}>{item.description}</Text>
			</View>
			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={[styles.actionButton, styles.editButton]}
					onPress={() => openCategoryModal(item)}
				>
					<Text style={styles.buttonText}>Sửa</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.actionButton, styles.deleteButton]}
					onPress={() =>
						Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa danh mục "${item.name}"?`, [
							{ text: 'Hủy', style: 'cancel' },
							{ text: 'Xóa', onPress: () => deleteCategory(item._id) },
						])
					}
				>
					<Text style={styles.buttonText}>Xóa</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	// Check if user is a MANAGER
	if (user?.role !== 'MANAGER') {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>Quyền truy cập bị từ chối</Text>
				<Text style={styles.subtitle}>Bạn không có quyền MANAGER để truy cập trang này</Text>
			</View>
		);
	}

	// Main render
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Trang Quản Trị</Text>
			<Text style={styles.welcomeText}>Xin chào, {user?.fullName}</Text>

			{/* Tab Selector */}
			<View style={styles.tabContainer}>
				<TouchableOpacity
					style={[styles.tab, activeTab === 'products' && styles.activeTab]}
					onPress={() => setActiveTab('products')}
				>
					<Text style={activeTab === 'products' ? styles.activeTabText : styles.tabText}>Sản phẩm</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
					onPress={() => setActiveTab('categories')}
				>
					<Text style={activeTab === 'categories' ? styles.activeTabText : styles.tabText}>Danh mục</Text>
				</TouchableOpacity>
			</View>

			{/* Content Area */}
			<View style={styles.contentContainer}>
				{isLoading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size='large' color='#2f95dc' />
						<Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
					</View>
				) : activeTab === 'products' ? (
					<>
						<View style={styles.headerContainer}>
							<Text style={styles.sectionTitle}>Quản lý sản phẩm</Text>
							<TouchableOpacity style={styles.addButton} onPress={() => openProductModal()}>
								<Text style={styles.buttonText}>Thêm sản phẩm</Text>
							</TouchableOpacity>
						</View>
						<FlatList
							data={products}
							renderItem={renderProductItem}
							keyExtractor={(item) => item._id}
							style={styles.list}
							contentContainerStyle={styles.listContent}
							ListEmptyComponent={<Text style={styles.emptyText}>Không có sản phẩm nào</Text>}
						/>
					</>
				) : (
					<>
						<View style={styles.headerContainer}>
							<Text style={styles.sectionTitle}>Quản lý danh mục</Text>
							<TouchableOpacity style={styles.addButton} onPress={() => openCategoryModal()}>
								<Text style={styles.buttonText}>Thêm danh mục</Text>
							</TouchableOpacity>
						</View>
						<FlatList
							data={categories}
							renderItem={renderCategoryItem}
							keyExtractor={(item) => item._id}
							style={styles.list}
							contentContainerStyle={styles.listContent}
							ListEmptyComponent={<Text style={styles.emptyText}>Không có danh mục nào</Text>}
						/>
					</>
				)}
			</View>

			{/* Product Modal */}
			<Modal
				animationType='slide'
				transparent={true}
				visible={productModalVisible}
				onRequestClose={() => setProductModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<ScrollView>
							<Text style={styles.modalTitle}>
								{currentProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
							</Text>

							<Text style={styles.inputLabel}>Tên sản phẩm *</Text>
							<TextInput
								style={styles.input}
								value={productForm.name}
								onChangeText={(text) => setProductForm({ ...productForm, name: text })}
								placeholder='Nhập tên sản phẩm'
							/>

							<Text style={styles.inputLabel}>Thương hiệu *</Text>
							<TextInput
								style={styles.input}
								value={productForm.brand}
								onChangeText={(text) => setProductForm({ ...productForm, brand: text })}
								placeholder='Nhập tên thương hiệu'
							/>

							<Text style={styles.inputLabel}>Giá (đ) *</Text>
							<TextInput
								style={styles.input}
								value={productForm.price}
								onChangeText={(text) => setProductForm({ ...productForm, price: text })}
								placeholder='Nhập giá sản phẩm'
								keyboardType='numeric'
							/>

							<Text style={styles.inputLabel}>Số lượng tồn kho *</Text>
							<TextInput
								style={styles.input}
								value={productForm.stockQuantity}
								onChangeText={(text) => setProductForm({ ...productForm, stockQuantity: text })}
								placeholder='Nhập số lượng'
								keyboardType='numeric'
							/>

							<Text style={styles.inputLabel}>Mô tả</Text>
							<TextInput
								style={[styles.input, styles.textArea]}
								value={productForm.description}
								onChangeText={(text) => setProductForm({ ...productForm, description: text })}
								placeholder='Mô tả sản phẩm'
								multiline
							/>

							<Text style={styles.inputLabel}>ID Danh mục *</Text>
							<TextInput
								style={styles.input}
								value={productForm.category}
								onChangeText={(text) => setProductForm({ ...productForm, category: text })}
								placeholder='Nhập ID danh mục'
							/>

							<Text style={styles.inputLabel}>Dung tích</Text>
							<TextInput
								style={styles.input}
								value={productForm.capacity}
								onChangeText={(text) => setProductForm({ ...productForm, capacity: text })}
								placeholder='Ví dụ: 100ml'
							/>

							<Text style={styles.inputLabel}>Xuất xứ</Text>
							<TextInput
								style={styles.input}
								value={productForm.origin}
								onChangeText={(text) => setProductForm({ ...productForm, origin: text })}
								placeholder='Nhập xuất xứ'
							/>

							<Text style={styles.inputLabel}>Hình ảnh (URL)</Text>
							<TextInput
								style={[styles.input, styles.textArea]}
								value={productForm.images}
								onChangeText={(text) => setProductForm({ ...productForm, images: text })}
								placeholder='Các URL hình ảnh (phân cách bằng dấu phẩy)'
								multiline
							/>

							<Text style={styles.inputLabel}>Thành phần</Text>
							<TextInput
								style={[styles.input, styles.textArea]}
								value={productForm.ingredients}
								onChangeText={(text) => setProductForm({ ...productForm, ingredients: text })}
								placeholder='Các thành phần (phân cách bằng dấu phẩy)'
								multiline
							/>

							<View style={styles.modalButtonContainer}>
								<TouchableOpacity
									style={[styles.modalButton, styles.cancelButton]}
									onPress={() => {
										setProductModalVisible(false);
										resetProductForm();
									}}
								>
									<Text style={styles.buttonText}>Hủy</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.modalButton, styles.saveButton]}
									onPress={currentProduct ? updateProduct : createProduct}
								>
									<Text style={styles.buttonText}>{currentProduct ? 'Cập nhật' : 'Tạo mới'}</Text>
								</TouchableOpacity>
							</View>
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Category Modal */}
			<Modal
				animationType='slide'
				transparent={true}
				visible={categoryModalVisible}
				onRequestClose={() => setCategoryModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<Text style={styles.modalTitle}>{currentCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</Text>

						<Text style={styles.inputLabel}>Tên danh mục *</Text>
						<TextInput
							style={styles.input}
							value={categoryForm.name}
							onChangeText={(text) => setCategoryForm({ ...categoryForm, name: text })}
							placeholder='Nhập tên danh mục'
						/>

						<Text style={styles.inputLabel}>Mô tả</Text>
						<TextInput
							style={[styles.input, styles.textArea]}
							value={categoryForm.description}
							onChangeText={(text) => setCategoryForm({ ...categoryForm, description: text })}
							placeholder='Mô tả danh mục'
							multiline
						/>

						<View style={styles.modalButtonContainer}>
							<TouchableOpacity
								style={[styles.modalButton, styles.cancelButton]}
								onPress={() => {
									setCategoryModalVisible(false);
									resetCategoryForm();
								}}
							>
								<Text style={styles.buttonText}>Hủy</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalButton, styles.saveButton]}
								onPress={currentCategory ? updateCategory : createCategory}
							>
								<Text style={styles.buttonText}>{currentCategory ? 'Cập nhật' : 'Tạo mới'}</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8f9fa',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		textAlign: 'center',
		marginVertical: 16,
		color: '#333',
	},
	subtitle: {
		fontSize: 16,
		textAlign: 'center',
		color: '#666',
		marginHorizontal: 20,
	},
	welcomeText: {
		fontSize: 16,
		textAlign: 'center',
		marginBottom: 16,
		color: '#2f95dc',
	},
	tabContainer: {
		flexDirection: 'row',
		marginHorizontal: 16,
		marginBottom: 16,
		borderRadius: 8,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#ddd',
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
		backgroundColor: '#f1f3f5',
	},
	activeTab: {
		backgroundColor: '#2f95dc',
	},
	tabText: {
		fontWeight: '500',
		color: '#555',
	},
	activeTabText: {
		fontWeight: 'bold',
		color: '#fff',
	},
	contentContainer: {
		flex: 1,
		marginHorizontal: 16,
	},
	headerContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
	},
	addButton: {
		backgroundColor: '#2f95dc',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 6,
	},
	buttonText: {
		color: '#fff',
		fontWeight: '500',
	},
	list: {
		flex: 1,
	},
	listContent: {
		paddingBottom: 16,
	},
	listItem: {
		backgroundColor: '#fff',
		padding: 16,
		marginVertical: 8,
		borderRadius: 8,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	listItemContent: {
		flex: 1,
		marginRight: 8,
	},
	itemTitle: {
		fontWeight: 'bold',
		fontSize: 16,
		marginBottom: 4,
	},
	buttonContainer: {
		flexDirection: 'row',
	},
	actionButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 4,
		marginLeft: 8,
	},
	editButton: {
		backgroundColor: '#2f95dc',
	},
	deleteButton: {
		backgroundColor: '#2f95dc',
	},
	emptyText: {
		textAlign: 'center',
		marginTop: 24,
		color: '#6c757d',
		fontStyle: 'italic',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 12,
		color: '#666',
	},
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalContainer: {
		width: '90%',
		maxHeight: '80%',
		backgroundColor: '#fff',
		borderRadius: 10,
		padding: 20,
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 16,
		color: '#333',
	},
	inputLabel: {
		fontWeight: '500',
		marginBottom: 4,
		color: '#555',
	},
	input: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 6,
		padding: 10,
		marginBottom: 16,
		backgroundColor: '#f9f9f9',
	},
	textArea: {
		minHeight: 80,
		textAlignVertical: 'top',
	},
	modalButtonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 8,
	},
	modalButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 6,
		alignItems: 'center',
		marginHorizontal: 8,
	},
	cancelButton: {
		backgroundColor: '#2f95dc',
	},
	saveButton: {
		backgroundColor: '#2f95dc',
	},
	productImage: {
		width: 50,
		height: 50,
		borderRadius: 4,
		marginRight: 12,
	},
});

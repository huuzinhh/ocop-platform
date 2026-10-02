package com.ocop.service;

import com.ocop.entity.Category;
import com.ocop.entity.Product;
import com.ocop.repository.CategoryRepository;
import com.ocop.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Optional<Product> getProductBySlug(String slug) {
        return productRepository.findBySlug(slug);
    }

    public List<Product> getProductsByStar(Short star) {
        return productRepository.findByOcopStarRating(star);
    }

    public List<Product> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return productRepository.findAll();
        }
        return productRepository.searchProducts(query.trim());
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }
}

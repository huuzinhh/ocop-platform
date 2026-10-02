package com.ocop.service;

import com.ocop.dto.product.CreateProductRequest;
import com.ocop.entity.Category;
import com.ocop.entity.Producer;
import com.ocop.entity.Product;
import com.ocop.entity.User;
import com.ocop.repository.CategoryRepository;
import com.ocop.repository.ProducerRepository;
import com.ocop.repository.ProductRepository;
import com.ocop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@Transactional(readOnly = true)
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProducerRepository producerRepository;

    @Autowired
    private UserRepository userRepository;

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

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    public static String toSlug(String input) {
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }

    @Transactional
    public Product createProduct(String username, CreateProductRequest request) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục ID: " + request.getCategoryId()));

        Producer producer = null;
        if (request.getProducerId() != null) {
            producer = producerRepository.findById(request.getProducerId()).orElse(null);
        }

        if (producer == null) {
            // Lấy producer đầu tiên hoặc producer của user nếu có
            List<Producer> producers = producerRepository.findAll();
            if (!producers.isEmpty()) {
                producer = producers.get(0);
            } else {
                throw new RuntimeException("Chưa có cơ sở sản xuất OCOP nào trong hệ thống");
            }
        }

        String baseSlug = toSlug(request.getName());
        String finalSlug = baseSlug + "-" + System.currentTimeMillis() % 10000;

        Product product = new Product();
        product.setName(request.getName());
        product.setSlug(finalSlug);
        product.setCategory(category);
        product.setProducer(producer);
        product.setDescription(request.getDescription());
        product.setCulturalStory(request.getCulturalStory());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 100);
        product.setUnit(request.getUnit() != null ? request.getUnit() : "Hộp");
        product.setOcopStarRating(request.getOcopStarRating() != null ? request.getOcopStarRating() : 4);
        product.setThumbnail(request.getThumbnail() != null && !request.getThumbnail().isEmpty() ? request.getThumbnail() : "https://placehold.co/400x300?text=OCOP+Product");
        product.setStatus("ACTIVE");
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());

        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, CreateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + id));

        if (request.getName() != null) product.setName(request.getName());
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));
            product.setCategory(category);
        }
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getCulturalStory() != null) product.setCulturalStory(request.getCulturalStory());
        if (request.getPrice() != null) product.setPrice(request.getPrice());
        if (request.getStockQuantity() != null) product.setStockQuantity(request.getStockQuantity());
        if (request.getUnit() != null) product.setUnit(request.getUnit());
        if (request.getOcopStarRating() != null) product.setOcopStarRating(request.getOcopStarRating());
        if (request.getThumbnail() != null) product.setThumbnail(request.getThumbnail());
        product.setUpdatedAt(LocalDateTime.now());

        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + id));
        productRepository.delete(product);
    }
}

package com.ocop.service;

import com.ocop.dto.product.CreateProductRequest;
import com.ocop.entity.Category;
import com.ocop.entity.OcopCertificate;
import com.ocop.entity.Producer;
import com.ocop.entity.Product;
import com.ocop.entity.User;
import com.ocop.repository.CategoryRepository;
import com.ocop.repository.OcopCertificateRepository;
import com.ocop.repository.OrderItemRepository;
import com.ocop.repository.ProducerRepository;
import com.ocop.repository.ProductRepository;
import com.ocop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDate;
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

    @Autowired
    private OcopCertificateRepository ocopCertificateRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

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

    public List<Product> getMyProducts(String username) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
        if (isAdmin) {
            return productRepository.findAll();
        }

        Producer producer = producerRepository.findByUserId(user.getId()).orElse(null);
        if (producer == null) {
            return java.util.Collections.emptyList();
        }
        return productRepository.findByProducerId(producer.getId());
    }

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    public static String toSlug(String input) {
        if (input == null) return "san-pham";
        String converted = input.replace("đ", "d").replace("Đ", "D");
        String nowhitespace = WHITESPACE.matcher(converted).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        slug = slug.replaceAll("-+", "-").replaceAll("^-|-$", "");
        return slug.isEmpty() ? "san-pham" : slug.toLowerCase(Locale.ENGLISH);
    }

    @Transactional
    public Product createProduct(String username, CreateProductRequest request) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục ID: " + request.getCategoryId()));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
        boolean isProducerRole = user.getRoles().stream().anyMatch(r -> "ROLE_PRODUCER".equals(r.getName()));

        Producer producer = producerRepository.findByUserId(user.getId()).orElse(null);

        // Tự động khởi tạo hồ sơ Producer nếu tài khoản có vai trò ROLE_PRODUCER nhưng chưa có bản ghi
        if (producer == null && isProducerRole) {
            producer = new Producer();
            producer.setUser(user);
            producer.setName(user.getFullName() != null && !user.getFullName().trim().isEmpty() 
                    ? user.getFullName().trim() : "Cơ sở " + user.getUsername());
            producer.setCode("PROD-" + user.getUsername().toUpperCase() + "-" + (System.currentTimeMillis() % 100000));
            producer.setDescription("Cơ sở sản xuất đặc sản OCOP " + user.getFullName());
            producer.setContactEmail(user.getEmail());
            producer.setPhone(user.getPhone());
            producer.setIsVerified(true);
            producer = producerRepository.save(producer);
        }

        // Nếu là Admin, có thể chỉ định producerId hoặc chọn producer đầu tiên
        if (producer == null && isAdmin) {
            if (request.getProducerId() != null) {
                producer = producerRepository.findById(request.getProducerId()).orElse(null);
            }
            if (producer == null) {
                List<Producer> producers = producerRepository.findAll();
                if (!producers.isEmpty()) {
                    producer = producers.get(0);
                }
            }
        }

        if (producer == null) {
            throw new RuntimeException("Không tìm thấy hồ sơ Nhà sản xuất liên kết với tài khoản này");
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
        product.setStatus(request.getStatus() != null && !request.getStatus().trim().isEmpty() ? request.getStatus().trim() : "ACTIVE");
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());

        Product savedProduct = productRepository.save(product);

        // Lưu thông tin chứng nhận OCOP nếu được khai báo
        if (request.getCertificateCode() != null && !request.getCertificateCode().trim().isEmpty()) {
            OcopCertificate cert = new OcopCertificate();
            cert.setProduct(savedProduct);
            cert.setCertificateCode(request.getCertificateCode().trim());
            cert.setStarRating(savedProduct.getOcopStarRating());
            cert.setIssuedDate(request.getIssuedDate() != null ? request.getIssuedDate() : LocalDate.now().minusMonths(1));
            cert.setExpiryDate(request.getExpiryDate() != null ? request.getExpiryDate() : LocalDate.now().plusYears(3));
            cert.setIssuingAuthority(request.getIssuingAuthority() != null && !request.getIssuingAuthority().trim().isEmpty()
                    ? request.getIssuingAuthority().trim() : "Ủy ban nhân dân Tỉnh / Thành phố");
            cert.setDocumentUrl(request.getDocumentUrl());
            cert.setIsSampleData(false);
            cert.setStatus("PENDING");
            ocopCertificateRepository.save(cert);
            savedProduct.setOcopCertificate(cert);
        }

        return savedProduct;
    }

    @Transactional
    public Product updateProduct(Long id, CreateProductRequest request) {
        return updateProduct(null, id, request);
    }

    @Transactional
    public Product updateProduct(String username, Long id, CreateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + id));

        if (username != null) {
            User user = userRepository.findByUsernameOrEmail(username, username)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));
            boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
            if (!isAdmin) {
                Producer producer = producerRepository.findByUserId(user.getId()).orElse(null);
                if (producer == null || product.getProducer() == null || !producer.getId().equals(product.getProducer().getId())) {
                    throw new RuntimeException("Bạn không có quyền chỉnh sửa sản phẩm của cơ sở khác");
                }
            }
        }

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
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            product.setStatus(request.getStatus().trim());
        }
        product.setUpdatedAt(LocalDateTime.now());

        // Cập nhật hoặc khai báo bổ sung chứng nhận OCOP
        if (request.getCertificateCode() != null && !request.getCertificateCode().trim().isEmpty()) {
            OcopCertificate cert = product.getOcopCertificate();
            if (cert == null) {
                cert = ocopCertificateRepository.findByProductId(product.getId()).orElse(new OcopCertificate());
                cert.setProduct(product);
            }
            cert.setCertificateCode(request.getCertificateCode().trim());
            cert.setStarRating(product.getOcopStarRating());
            if (request.getIssuedDate() != null) cert.setIssuedDate(request.getIssuedDate());
            else if (cert.getIssuedDate() == null) cert.setIssuedDate(LocalDate.now().minusMonths(1));

            if (request.getExpiryDate() != null) cert.setExpiryDate(request.getExpiryDate());
            else if (cert.getExpiryDate() == null) cert.setExpiryDate(LocalDate.now().plusYears(3));

            if (request.getIssuingAuthority() != null && !request.getIssuingAuthority().trim().isEmpty()) {
                cert.setIssuingAuthority(request.getIssuingAuthority().trim());
            } else if (cert.getIssuingAuthority() == null) {
                cert.setIssuingAuthority("Hội đồng đánh giá phân hạng sản phẩm OCOP");
            }
            if (request.getDocumentUrl() != null) cert.setDocumentUrl(request.getDocumentUrl());
            cert.setIsSampleData(false);
            if (cert.getStatus() == null || "REJECTED".equalsIgnoreCase(cert.getStatus())) {
                cert.setStatus("PENDING");
                cert.setRejectionReason(null);
            }
            ocopCertificateRepository.save(cert);
            product.setOcopCertificate(cert);
        }

        return productRepository.save(product);
    }

    @Transactional
    public String deleteProduct(Long id) {
        return deleteProduct(null, id);
    }

    @Transactional
    public String deleteProduct(String username, Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + id));

        if (username != null) {
            User user = userRepository.findByUsernameOrEmail(username, username)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));
            boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
            if (!isAdmin) {
                Producer producer = producerRepository.findByUserId(user.getId()).orElse(null);
                if (producer == null || product.getProducer() == null || !producer.getId().equals(product.getProducer().getId())) {
                    throw new RuntimeException("Bạn không có quyền xóa sản phẩm của cơ sở khác");
                }
            }
        }

        long orderCount = orderItemRepository.countByProductId(id);
        if (orderCount > 0) {
            product.setStatus("INACTIVE");
            product.setUpdatedAt(LocalDateTime.now());
            productRepository.save(product);
            return "Sản phẩm đã có " + orderCount + " đơn hàng, đã tự động chuyển sang trạng thái 'Ngừng kinh doanh (Ẩn)' để lưu trữ lịch sử.";
        }

        productRepository.delete(product);
        return "Đã xóa sản phẩm thành công khỏi hệ thống.";
    }
}

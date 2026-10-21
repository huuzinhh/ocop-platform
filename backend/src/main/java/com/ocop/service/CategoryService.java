package com.ocop.service;

import com.ocop.dto.category.CategoryDto;
import com.ocop.dto.category.CreateCategoryRequest;
import com.ocop.entity.Category;
import com.ocop.entity.Product;
import com.ocop.repository.CategoryRepository;
import com.ocop.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    public List<CategoryDto> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        List<CategoryDto> dtos = new ArrayList<>();

        for (Category cat : categories) {
            List<Product> prods = productRepository.findByCategoryId(cat.getId());
            dtos.add(new CategoryDto(
                    cat.getId(),
                    cat.getName(),
                    cat.getSlug(),
                    cat.getDescription(),
                    cat.getIconUrl(),
                    prods.size()
            ));
        }

        return dtos;
    }

    public CategoryDto getCategoryById(Long id) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục ID: " + id));
        List<Product> prods = productRepository.findByCategoryId(cat.getId());
        return new CategoryDto(cat.getId(), cat.getName(), cat.getSlug(), cat.getDescription(), cat.getIconUrl(), prods.size());
    }

    @Transactional
    public CategoryDto createCategory(CreateCategoryRequest request) {
        String baseSlug = ProductService.toSlug(request.getName());
        String slug = baseSlug;
        int counter = 1;
        while (categoryRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + counter++;
        }

        Category category = new Category();
        category.setName(request.getName().trim());
        category.setSlug(slug);
        category.setDescription(request.getDescription());
        category.setIconUrl(request.getIconUrl() != null && !request.getIconUrl().trim().isEmpty()
                ? request.getIconUrl().trim()
                : "https://placehold.co/64x64?text=OCOP");

        Category saved = categoryRepository.save(category);
        return new CategoryDto(saved.getId(), saved.getName(), saved.getSlug(), saved.getDescription(), saved.getIconUrl(), 0);
    }

    @Transactional
    public CategoryDto updateCategory(Long id, CreateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục ID: " + id));

        if (!category.getName().equalsIgnoreCase(request.getName().trim())) {
            String baseSlug = ProductService.toSlug(request.getName());
            String slug = baseSlug;
            int counter = 1;
            while (categoryRepository.findBySlug(slug).isPresent() && !categoryRepository.findBySlug(slug).get().getId().equals(id)) {
                slug = baseSlug + "-" + counter++;
            }
            category.setSlug(slug);
        }

        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        if (request.getIconUrl() != null) {
            category.setIconUrl(request.getIconUrl().trim());
        }

        Category saved = categoryRepository.save(category);
        int prodCount = productRepository.findByCategoryId(saved.getId()).size();
        return new CategoryDto(saved.getId(), saved.getName(), saved.getSlug(), saved.getDescription(), saved.getIconUrl(), prodCount);
    }

    @Transactional
    public String deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục ID: " + id));

        List<Product> products = productRepository.findByCategoryId(id);
        if (!products.isEmpty()) {
            throw new RuntimeException("Không thể xóa danh mục \"" + category.getName() + "\" vì đang có " + products.size() + " sản phẩm OCOP thuộc danh mục này.");
        }

        categoryRepository.delete(category);
        return "Đã xóa danh mục \"" + category.getName() + "\" thành công";
    }
}

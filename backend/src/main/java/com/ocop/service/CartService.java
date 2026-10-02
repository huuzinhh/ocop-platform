package com.ocop.service;

import com.ocop.dto.cart.AddToCartRequest;
import com.ocop.dto.cart.CartDto;
import com.ocop.entity.Cart;
import com.ocop.entity.CartItem;
import com.ocop.entity.Product;
import com.ocop.entity.User;
import com.ocop.repository.CartItemRepository;
import com.ocop.repository.CartRepository;
import com.ocop.repository.ProductRepository;
import com.ocop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    private Cart getOrCreateCart(User user) {
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> cartRepository.save(new Cart(user)));
    }

    @Transactional(readOnly = true)
    public CartDto getCart(String username) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));
        Cart cart = getOrCreateCart(user);
        return CartDto.fromEntity(cart);
    }

    public CartDto addToCart(String username, AddToCartRequest request) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm ID: " + request.getProductId()));

        if (product.getStockQuantity() < request.getQuantity()) {
            throw new IllegalArgumentException("Số lượng tồn kho không đủ (còn " + product.getStockQuantity() + " " + product.getUnit() + ")");
        }

        Cart cart = getOrCreateCart(user);

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());
        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int newQuantity = existingItem.getQuantity() + request.getQuantity();
            if (product.getStockQuantity() < newQuantity) {
                throw new IllegalArgumentException("Số lượng trong giỏ vượt quá tồn kho (còn " + product.getStockQuantity() + ")");
            }
            existingItem.setQuantity(newQuantity);
            existingItem.setUnitPrice(product.getPrice());
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = new CartItem(cart, product, request.getQuantity(), product.getPrice());
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        return CartDto.fromEntity(cart);
    }

    public CartDto updateCartItem(String username, Long itemId, Integer quantity) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));
        Cart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món trong giỏ hàng"));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Bạn không có quyền chỉnh sửa món hàng này");
        }

        if (quantity <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
        } else {
            if (item.getProduct().getStockQuantity() < quantity) {
                throw new IllegalArgumentException("Số lượng vượt quá tồn kho (còn " + item.getProduct().getStockQuantity() + ")");
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }

        return CartDto.fromEntity(cart);
    }

    public CartDto removeCartItem(String username, Long itemId) {
        return updateCartItem(username, itemId, 0);
    }

    public CartDto clearCart(String username) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));
        Cart cart = getOrCreateCart(user);
        cart.getItems().clear();
        cartRepository.save(cart);
        return CartDto.fromEntity(cart);
    }
}

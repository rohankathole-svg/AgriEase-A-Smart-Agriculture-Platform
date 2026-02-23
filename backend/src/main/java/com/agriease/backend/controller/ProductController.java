package com.agriease.backend.controller;

import com.agriease.backend.dto.ProductRequest;
import com.agriease.backend.dto.ProductMarketplaceDto;
import com.agriease.backend.entity.Product;
import com.agriease.backend.service.ProductService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@CrossOrigin
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // Supplier add product
    @PostMapping("/supplier/products")
    @PreAuthorize("hasRole('SUPPLIER')")
    public Product addProduct(Authentication authentication,
                              @RequestBody ProductRequest request) {
        String email = authentication.getName();
        return productService.createProduct(email, request);
    }

    // Public view all products
    @GetMapping("/products")
    public List<ProductMarketplaceDto> getAllProducts() {
        return productService.getMarketplaceProducts();
    }

    // Supplier view own products
    @GetMapping("/supplier/products")
    @PreAuthorize("hasRole('SUPPLIER')")
    public List<Product> getSupplierProducts(Authentication authentication) {
        String email = authentication.getName();
        return productService.getProductsForSupplier(email);
    }

    // Supplier delete product
    @DeleteMapping("/supplier/products/{id}")
    @PreAuthorize("hasRole('SUPPLIER')")
    public void deleteProduct(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        productService.deleteProductForSupplier(id, email);
    }

    // Supplier update product
    @PutMapping("/supplier/products/{id}")
    @PreAuthorize("hasRole('SUPPLIER')")
    public Product updateProduct(@PathVariable Long id,
                                 @RequestBody Product product,
                                 Authentication authentication) {
        String email = authentication.getName();
        return productService.updateProduct(id, email, product);
    }
}

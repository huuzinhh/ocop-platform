package com.ocop.service;

import com.ocop.dto.gis.GisMarkerDto;
import com.ocop.dto.gis.GisProductItemDto;
import com.ocop.dto.gis.UpdateProducerLocationRequest;
import com.ocop.entity.Location;
import com.ocop.entity.Producer;
import com.ocop.entity.Product;
import com.ocop.entity.User;
import com.ocop.repository.LocationRepository;
import com.ocop.repository.ProducerRepository;
import com.ocop.repository.ProductRepository;
import com.ocop.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class GisService {

    @Autowired
    private ProducerRepository producerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private UserRepository userRepository;

    public List<GisMarkerDto> getGisMarkers(String province, Short starRating, Long categoryId, String search) {
        List<Producer> producers = producerRepository.findAll();
        List<GisMarkerDto> markers = new ArrayList<>();

        for (Producer producer : producers) {
            Location loc = producer.getLocation();
            if (loc == null || loc.getLatitude() == null || loc.getLongitude() == null) {
                continue;
            }

            // Lọc theo Tỉnh/Thành phố
            if (province != null && !province.trim().isEmpty() && !province.equalsIgnoreCase("ALL")) {
                if (loc.getProvince() == null || !loc.getProvince().toLowerCase().contains(province.trim().toLowerCase())) {
                    continue;
                }
            }

            // Lấy danh sách sản phẩm của cơ sở
            List<Product> products = productRepository.findByProducerId(producer.getId());

            // Lọc sản phẩm theo danh mục nếu có
            if (categoryId != null && categoryId > 0) {
                boolean hasCategory = products.stream()
                        .anyMatch(p -> p.getCategory() != null && p.getCategory().getId().equals(categoryId));
                if (!hasCategory) {
                    continue;
                }
            }

            // Lọc theo hạng sao OCOP nếu có
            if (starRating != null && starRating > 0) {
                boolean hasStar = products.stream()
                        .anyMatch(p -> p.getOcopStarRating() != null && p.getOcopStarRating().equals(starRating));
                if (!hasStar) {
                    continue;
                }
            }

            // Lọc theo từ khóa tìm kiếm (tên cơ sở hoặc tên sản phẩm)
            if (search != null && !search.trim().isEmpty()) {
                String q = search.trim().toLowerCase();
                boolean matchProducer = (producer.getName() != null && producer.getName().toLowerCase().contains(q))
                        || (loc.getProvince() != null && loc.getProvince().toLowerCase().contains(q))
                        || (loc.getDistrict() != null && loc.getDistrict().toLowerCase().contains(q));
                boolean matchProduct = products.stream()
                        .anyMatch(p -> p.getName() != null && p.getName().toLowerCase().contains(q));
                if (!matchProducer && !matchProduct) {
                    continue;
                }
            }

            // Xây dựng DTO
            GisMarkerDto marker = new GisMarkerDto();
            marker.setProducerId(producer.getId());
            marker.setProducerName(producer.getName());
            marker.setProducerCode(producer.getCode());
            marker.setDescription(producer.getDescription());
            marker.setPhone(producer.getPhone());
            marker.setContactEmail(producer.getContactEmail());
            marker.setWebsite(producer.getWebsite());
            marker.setIsVerified(producer.getIsVerified());

            marker.setLocationId(loc.getId());
            marker.setProvince(loc.getProvince());
            marker.setDistrict(loc.getDistrict());
            marker.setWard(loc.getWard());
            marker.setAddressDetail(loc.getAddressDetail());
            marker.setLatitude(loc.getLatitude());
            marker.setLongitude(loc.getLongitude());

            short maxStar = 0;
            List<GisProductItemDto> itemDtos = new ArrayList<>();
            for (Product p : products) {
                if (p.getOcopStarRating() != null && p.getOcopStarRating() > maxStar) {
                    maxStar = p.getOcopStarRating();
                }

                GisProductItemDto item = new GisProductItemDto();
                item.setId(p.getId());
                item.setName(p.getName());
                item.setSlug(p.getSlug());
                item.setPrice(p.getPrice());
                item.setUnit(p.getUnit());
                item.setOcopStarRating(p.getOcopStarRating());
                item.setThumbnail(p.getThumbnail());
                item.setCategoryName(p.getCategory() != null ? p.getCategory().getName() : "");
                if (p.getOcopCertificate() != null) {
                    item.setCertificateCode(p.getOcopCertificate().getCertificateCode());
                    item.setCertificateStatus(p.getOcopCertificate().getStatus());
                }
                itemDtos.add(item);
            }

            marker.setMaxStarRating(maxStar > 0 ? maxStar : 4);
            marker.setTotalProducts(products.size());
            marker.setProducts(itemDtos);

            markers.add(marker);
        }

        // Sắp xếp: Ưu tiên các cơ sở có nhiều sản phẩm và hạng sao cao lên đầu
        markers.sort((a, b) -> {
            int cmp = Integer.compare(b.getTotalProducts(), a.getTotalProducts());
            if (cmp != 0) return cmp;
            return Short.compare(b.getMaxStarRating() != null ? b.getMaxStarRating() : 0,
                    a.getMaxStarRating() != null ? a.getMaxStarRating() : 0);
        });

        return markers;
    }

    public List<String> getProvinces() {
        return producerRepository.findAll().stream()
                .map(Producer::getLocation)
                .filter(Objects::nonNull)
                .map(Location::getProvince)
                .filter(Objects::nonNull)
                .map(String::trim)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Transactional
    public Producer updateProducerLocation(Long producerId, UpdateProducerLocationRequest request, String username) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng: " + username));

        Producer producer = producerRepository.findById(producerId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cơ sở sản xuất ID: " + producerId));

        boolean isAdmin = user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
        boolean isOwner = producer.getUser() != null && producer.getUser().getId().equals(user.getId());

        if (!isAdmin && !isOwner) {
            throw new RuntimeException("Bạn không có quyền cập nhật tọa độ cho cơ sở này!");
        }

        Location location = producer.getLocation();
        if (location == null) {
            location = new Location();
        }

        location.setProvince(request.getProvince().trim());
        location.setDistrict(request.getDistrict() != null ? request.getDistrict().trim() : null);
        location.setWard(request.getWard() != null ? request.getWard().trim() : null);
        location.setAddressDetail(request.getAddressDetail() != null ? request.getAddressDetail().trim() : null);
        location.setLatitude(request.getLatitude());
        location.setLongitude(request.getLongitude());

        Location savedLocation = locationRepository.save(location);
        producer.setLocation(savedLocation);

        return producerRepository.save(producer);
    }
}

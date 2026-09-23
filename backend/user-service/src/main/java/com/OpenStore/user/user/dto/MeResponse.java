package com.OpenStore.user.user.dto;

import com.OpenStore.user.user.domain.SubscriptionPlan;
import com.OpenStore.user.user.domain.UserRole;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class MeResponse {
    private UUID id;
    private UserRole role;
    private SubscriptionPlan subscriptions;
    private String phoneNumber;
}

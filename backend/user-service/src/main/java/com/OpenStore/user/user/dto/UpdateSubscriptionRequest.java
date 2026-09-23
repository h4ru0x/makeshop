package com.OpenStore.user.user.dto;

import com.OpenStore.user.user.domain.SubscriptionPlan;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateSubscriptionRequest {

    @NotNull
    @JsonAlias({"subscription", "suscription", "subcription"})
    private SubscriptionPlan subscription;
}

package com.dunx.swpoolm.operation.repository;

import com.dunx.swpoolm.operation.entity.Shift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Integer> {
}
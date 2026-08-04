package com.dunx.swpoolm.iam.repository;

import com.dunx.swpoolm.iam.entity.PersistentLogin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface PersistentLoginRepository extends JpaRepository<PersistentLogin, String> {

    @Transactional
    void deleteByUsername(String username);
}
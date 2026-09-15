package com.ntc.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.ntc.backend.enums.StaffRole;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "staff")
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "staff_id", unique = true, nullable = false)
    private String staffId;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String branch;

    @Column(nullable = false)
    private String password;

    @Column(name = "is_first_login")
    private boolean isFirstLogin = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaffRole role = StaffRole.STAFF;

    // ===== Reporting hierarchy =====
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_head_id")
    @JsonIgnore
    private Staff sectionHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_head_id")
    @JsonIgnore
    private Staff departmentHead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    @JsonIgnore
    private Staff createdBy;

    // ===== Digital signature =====
    @Column(name = "signature_path")
    private String signaturePath;

    @Column(name = "signature_uploaded_at")
    private Instant signatureUploadedAt;

    @OneToMany(mappedBy = "staff", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<LeaveRequest> leaveRequests = new ArrayList<>();

    public Staff() {}

    // ---------- getters and setters ----------
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getBranch() { return branch; }
    public void setBranch(String branch) { this.branch = branch; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public boolean isFirstLogin() { return isFirstLogin; }
    public void setFirstLogin(boolean firstLogin) { isFirstLogin = firstLogin; }

    public StaffRole getRole() { return role; }
    public void setRole(StaffRole role) { this.role = role; }

    public Staff getSectionHead() { return sectionHead; }
    public void setSectionHead(Staff sectionHead) { this.sectionHead = sectionHead; }

    public Staff getDepartmentHead() { return departmentHead; }
    public void setDepartmentHead(Staff departmentHead) { this.departmentHead = departmentHead; }

    public Staff getCreatedBy() { return createdBy; }
    public void setCreatedBy(Staff createdBy) { this.createdBy = createdBy; }

    public String getSignaturePath() { return signaturePath; }
    public void setSignaturePath(String signaturePath) { this.signaturePath = signaturePath; }

    public Instant getSignatureUploadedAt() { return signatureUploadedAt; }
    public void setSignatureUploadedAt(Instant signatureUploadedAt) { this.signatureUploadedAt = signatureUploadedAt; }

    public List<LeaveRequest> getLeaveRequests() { return leaveRequests; }
    public void setLeaveRequests(List<LeaveRequest> leaveRequests) { this.leaveRequests = leaveRequests; }
}
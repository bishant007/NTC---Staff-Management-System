package com.ntc.backend.entity;

import com.ntc.backend.enums.LeaveType;
import jakarta.persistence.*;

@Entity
@Table(name = "leave_balances",
        uniqueConstraints = @UniqueConstraint(columnNames = {"staff_id", "leave_type"}))
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_type", nullable = false)
    private LeaveType leaveType;

    @Column(name = "total_entitled", nullable = false)
    private int totalEntitled;

    /** Stored as double to support half-day (0.5) and hour-based deductions. */
    @Column(name = "used", nullable = false)
    private double used = 0.0;

    public LeaveBalance() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Staff getStaff() { return staff; }
    public void setStaff(Staff staff) { this.staff = staff; }

    public LeaveType getLeaveType() { return leaveType; }
    public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }

    public int getTotalEntitled() { return totalEntitled; }
    public void setTotalEntitled(int totalEntitled) { this.totalEntitled = totalEntitled; }

    public double getUsed() { return used; }
    public void setUsed(double used) { this.used = used; }

    /** Convenience for UI/API — remaining = entitled − used. */
    public double getRemaining() { return totalEntitled - used; }
}
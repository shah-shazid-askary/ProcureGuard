export interface Vendor {
    id: string;
    name: string;
    tier?: number;
    region?: string;
    risk_score?: number;
    status?: string;
    jurisdiction?: string;
}

export interface Invoice {
    id: string;
    vendor_id?: string;
    amount: number;
    status?: string;
    date_issued?: string;
    po_number?: string;
}

export interface Approver {
    id: string;
    name: string;
    role: string;
}

export interface RiskEvent {
    id: string;
    type: string;
    severity: string;
    date_detected: string;
    category: string;
}

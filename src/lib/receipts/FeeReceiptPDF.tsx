'use client';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff2', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Inter', fontSize: 10, color: '#1a1a1a' },
  header: { marginBottom: 20, borderBottom: '2 solid #1a56db', paddingBottom: 10 },
  schoolName: { fontSize: 16, fontWeight: 700, color: '#1a56db', marginBottom: 4 },
  schoolAddress: { fontSize: 9, color: '#666' },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 15, textAlign: 'center', marginTop: 5 },
  infoRow: { flexDirection: 'row', marginBottom: 10 },
  infoCol: { flex: 1 },
  label: { fontSize: 8, color: '#888', marginBottom: 2 },
  value: { fontSize: 10, fontWeight: 600 },
  table: { marginTop: 10, marginBottom: 15 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1a56db', padding: '6 8', borderRadius: 4 },
  tableHeaderText: { fontSize: 9, fontWeight: 700, color: '#fff' },
  tableRow: { flexDirection: 'row', padding: '6 8', borderBottom: '1 solid #e5e7eb' },
  tableCell: { fontSize: 9 },
  colName: { flex: 2 },
  colDue: { flex: 1, textAlign: 'right' },
  colPaid: { flex: 1, textAlign: 'right' },
  colOutstanding: { flex: 1, textAlign: 'right' },
  colStatus: { flex: 1, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', marginTop: 10, padding: 8, backgroundColor: '#f3f4f6', borderRadius: 4 },
  summaryLabel: { flex: 3, fontSize: 10, fontWeight: 600, textAlign: 'right', paddingRight: 10 },
  summaryValue: { flex: 1, fontSize: 10, fontWeight: 700, textAlign: 'right' },
  totalRow: { flexDirection: 'row', marginTop: 5, padding: 10, backgroundColor: '#1a56db', borderRadius: 4 },
  totalLabel: { flex: 3, fontSize: 11, fontWeight: 700, color: '#fff', textAlign: 'right', paddingRight: 10 },
  totalValue: { flex: 1, fontSize: 11, fontWeight: 700, color: '#fff', textAlign: 'right' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#888' },
  statusPaid: { color: '#059669', fontWeight: 600 },
  statusPartial: { color: '#d97706', fontWeight: 600 },
  statusUnpaid: { color: '#dc2626', fontWeight: 600 },
});

interface ReceiptItem {
  componentName: string;
  amountDue: number;
  amountPaid: number;
  outstanding: number;
  status: string;
}

interface ReceiptData {
  receiptNo: string;
  generatedAt: string;
  studentName: string;
  studentId: string;
  class: string;
  academicYear: string;
  term: string;
  items: ReceiptItem[];
  totalAmount: number;
  amountPaid: number;
  balance: number;
  paymentMethod?: string;
  transactionRef?: string;
  paidAt?: string;
}

export default function FeeReceiptPDF({ data }: { data: ReceiptData }) {
  const formatCurrency = (n: number) => `NGN ${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

  const paidItems = data.items.filter((i) => i.amountPaid > 0);
  const balanceItems = data.items.filter((i) => i.outstanding > 0);

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.schoolName}>EDUFLOW SCHOOL MANAGEMENT</Text>
          <Text style={styles.schoolAddress}>123 Education Street, Lagos, Nigeria | info@eduflow.com</Text>
        </View>

        <Text style={styles.title}>SCHOOL FEES RECEIPT</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.label}>RECEIPT NO.</Text>
            <Text style={styles.value}>{data.receiptNo}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>DATE</Text>
            <Text style={styles.value}>{new Date(data.generatedAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.label}>STUDENT NAME</Text>
            <Text style={styles.value}>{data.studentName}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>STUDENT ID</Text>
            <Text style={styles.value}>{data.studentId}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.label}>CLASS</Text>
            <Text style={styles.value}>{data.class}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>TERM / SESSION</Text>
            <Text style={styles.value}>{data.term} - {data.academicYear}</Text>
          </View>
        </View>

        {data.paymentMethod && (
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.label}>PAYMENT METHOD</Text>
              <Text style={styles.value}>{data.paymentMethod}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.label}>TRANSACTION REF.</Text>
              <Text style={styles.value}>{data.transactionRef || 'N/A'}</Text>
            </View>
          </View>
        )}

        {paidItems.length > 0 && (
          <>
            <Text style={{ fontSize: 10, fontWeight: 700, marginTop: 15, marginBottom: 5, color: '#059669' }}>
              PAYMENTS MADE THIS TRANSACTION
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colName]}>Fee Component</Text>
                <Text style={[styles.tableHeaderText, styles.colDue]}>Amount Due</Text>
                <Text style={[styles.tableHeaderText, styles.colPaid]}>Amount Paid</Text>
                <Text style={[styles.tableHeaderText, styles.colOutstanding]}>Outstanding</Text>
              </View>
              {paidItems.map((item, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colName]}>{item.componentName}</Text>
                  <Text style={[styles.tableCell, styles.colDue]}>{formatCurrency(item.amountDue)}</Text>
                  <Text style={[styles.tableCell, styles.colPaid, styles.statusPaid]}>{formatCurrency(item.amountPaid)}</Text>
                  <Text style={[styles.tableCell, styles.colOutstanding]}>{formatCurrency(item.outstanding)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {balanceItems.length > 0 && (
          <>
            <Text style={{ fontSize: 10, fontWeight: 700, marginTop: 5, marginBottom: 5, color: '#d97706' }}>
              OUTSTANDING BALANCES
            </Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colName]}>Fee Component</Text>
                <Text style={[styles.tableHeaderText, styles.colDue]}>Amount Due</Text>
                <Text style={[styles.tableHeaderText, styles.colOutstanding]}>Outstanding</Text>
              </View>
              {balanceItems.map((item, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colName]}>{item.componentName}</Text>
                  <Text style={[styles.tableCell, styles.colDue]}>{formatCurrency(item.amountDue)}</Text>
                  <Text style={[styles.tableCell, styles.colOutstanding, styles.statusPartial]}>{formatCurrency(item.outstanding)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>TOTAL BILLED:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(data.totalAmount)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>TOTAL PAID:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(data.amountPaid)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>BALANCE:</Text>
          <Text style={styles.totalValue}>{formatCurrency(data.balance)}</Text>
        </View>

        <Text style={styles.footer}>
          This is an official receipt generated by EDUFLOW School Management System.{'\n'}
          Please retain this receipt for your records. | Generated: {new Date().toLocaleString()}
        </Text>
      </Page>
    </Document>
  );
}
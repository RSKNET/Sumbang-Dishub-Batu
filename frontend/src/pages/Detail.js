import { useState, useEffect, useCallback } from "react";
import { Container } from "react-bootstrap";
import { useParams } from "react-router-dom";
import Button from "../components/common/Button";
import Status from "../components/common/Status";
import Table from "../components/common/Table";
import Spinner from "../components/common/Spinner";
import Notification from "../components/common/Notification";
import styles from "../styles/pages/Detail.module.css";
import { getDetail, updateStatus } from "../utils/api";

const Detail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [isAuthenticated] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "info",
  });

  const showNotification = (message, type = "info") => {
    setNotification({
      show: true,
      message,
      type,
    });
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchDetail = useCallback(async () => {
    setPageLoading(true);
    try {
      const result = await getDetail(id);
      if (result.success) {
        setData(result.data);
        if (result.newAccessToken) {
          localStorage.setItem("accessToken", result.newAccessToken);
        }
      } else {
        console.error("Gagal mengambil detail:", result.message);
        showNotification("Gagal memuat detail laporan", "error");
      }
    } catch (err) {
      console.error("Error saat fetch detail:", err);
      showNotification("Terjadi kesalahan saat memuat data", "error");
    } finally {
      setPageLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleStatusChange = async (status_id) => {
    setLoading(true);
    try {
      const result = await updateStatus(id, status_id);
      if (result.success) {
        showNotification("Status berhasil diperbarui!", "success");
        fetchDetail();
      } else {
        showNotification("Gagal memperbarui status.", "error");
      }
    } catch (err) {
      showNotification("Terjadi kesalahan saat memperbarui status.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.detailContainer}>
        <Container className={styles.container}>
          <div className={styles.errorState}>
            <h2>Silahkan Login Terlebih Dahulu</h2>
          </div>
        </Container>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className={styles.detailContainer}>
        <Container className={styles.container}>
          <Spinner
            size="large"
            text="Memuat detail laporan..."
            centered={true}
          />
        </Container>
      </div>
    );
  }

  const tableData = [
    { label: "Nama", value: data.nama },
    { label: "Alamat", value: data.alamat },
    { label: "No HP", value: data.no_hp },
    {
      label: "WhatsApp",
      value: (
        <a
          href={data.no_whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linkButton}
        >
          💬 Chat WhatsApp
        </a>
      ),
    },
    { label: "Permintaan", value: data.permintaan },
    { label: "Detail Permintaan", value: data.detail_permintaan },
    { label: "Lokasi", value: data.lokasi },
    { label: "Status", value: <Status status={data.status} /> },
    {
      label: "Aksi Status",
      value: (
        <div className={styles.actionButtons}>
          {data.status === "Menunggu" && (
            <>
              <Button
                variant="success"
                onClick={() => handleStatusChange(2)}
                loading={loading}
                icon="⚙️"
                size="small"
              >
                Proses
              </Button>
              <Button
                variant="danger"
                onClick={() => handleStatusChange(4)}
                loading={loading}
                icon="❌"
                size="small"
              >
                Tolak
              </Button>
            </>
          )}

          {data.status === "Diproses" && (
            <Button
              variant="primary"
              onClick={() => handleStatusChange(3)}
              loading={loading}
              icon="✅"
              size="small"
            >
              Selesai
            </Button>
          )}
        </div>
      ),
    },
  ];

  const tableColumns = [
    {
      key: "label",
      header: "Informasi",
      width: "30%",
      align: "left",
      render: (item) => <strong>{item.label}</strong>,
    },
    {
      key: "value",
      header: "Detail",
      width: "70%",
      align: "left",
      render: (item) => item.value,
    },
  ];

  return (
    <div className={styles.detailContainer}>
      <Container className={styles.container}>
        <div className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Detail Pelaporan</h1>
          <p className={styles.pageDescription}>
            Informasi lengkap dan status laporan masyarakat
          </p>
        </div>

        <div className={styles.contentSection}>
          <div className={styles.tableSection}>
            <Table
              columns={tableColumns}
              data={tableData}
              hover={true}
              responsive={true}
              noDataMessage="Tidak ada data laporan"
              noDataIcon="📄"
            />
          </div>

          <div className={styles.rightSection}>
            {data.surat ? (
              isMobile ? (
                <div className={styles.mobileDocumentPreview}>
                  <div className={styles.mobileDocumentIcon}>📄</div>
                  <div className={styles.mobileDocumentInfo}>
                    <p className={styles.mobileDocumentTitle}>Surat Tersedia</p>
                    <p className={styles.mobileDocumentSubtitle}>
                      Klik untuk membuka
                    </p>
                  </div>
                  <a
                    href={data.surat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mobileDocumentLink}
                  >
                    Buka Surat
                  </a>
                </div>
              ) : (
                <div className={styles.documentPreview}>
                  <iframe
                    src={data.surat}
                    title="Preview Surat"
                    className={styles.documentFrame}
                  />
                  <a
                    href={data.surat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.documentLink}
                  >
                    📄
                  </a>
                </div>
              )
            ) : (
              <div className={styles.noDocument}>
                <span className={styles.noDocumentIcon}>📄</span>
                <span className={styles.noDocumentText}>Tidak ada surat</span>
              </div>
            )}

            {data.foto ? (
              <div className={styles.imageContainer}>
                <img
                  src={data.foto}
                  alt="Dokumentasi Laporan"
                  className={styles.reportImage}
                />
                <a
                  href={data.foto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.imageLink}
                >
                  📷
                </a>
              </div>
            ) : (
              <div className={styles.noImage}>
                <span className={styles.noImageIcon}>📷</span>
                <span className={styles.noImageText}>Tidak ada gambar</span>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
        duration={4000}
        position="top-right"
      />
    </div>
  );
};

export default Detail;

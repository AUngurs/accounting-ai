import axios from "axios";

// Izveido pielāgotu Axios instanci ar bāzes URL un noklusējuma galvenēm
const axiosInstance = axios.create({
  baseURL: "http://localhost:5001/api", // Bāzes URL visiem API pieprasījumiem
  headers: { "Content-Type": "application/json" }, // Noklusējuma satura tips (JSON)
});

// Pieprasījumu interceptors, kas automātiski pievieno JWT tokenu, ja tas pastāv
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Iegūst tokenu no localStorage
  if (token) config.headers.Authorization = `Bearer ${token}`; // Pievieno tokenu Authorization galvenē
  return config; // Atgriež config, lai pieprasījums turpinātos
});

// Atbilžu interceptors, kas globāli apstrādā API kļūdas, īpaši autorizācijas kļūdas
axiosInstance.interceptors.response.use(
  (response) => response, // Ja atbilde ir veiksmīga, atgriež to
  (error) => {
    // Ja saņemta 401 (Unauthorized) vai 403 (Forbidden), izdzēš sensitīvos datus un pāradresē uz login
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem("token");
      localStorage.removeItem("companyId");
      window.location.href = "/login"; // Pāradresē lietotāju uz login lapu
    }
    return Promise.reject(error); // Nodod kļūdu konkrētajam API pieprasījumam
  }
);

export default axiosInstance; // Eksportē konfigurēto Axios instanci, lai to izmantotu visā aplikācijā

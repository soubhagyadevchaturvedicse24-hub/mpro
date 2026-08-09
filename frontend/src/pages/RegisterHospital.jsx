import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, MapPin, ShieldCheck, Lock, CheckCircle2, ArrowRight,
  ArrowLeft, FileText, Award, Upload, AlertCircle, Plus, Landmark,
  Heart, Check, Phone, Mail, FileCheck2, UserCheck, HeartPulse, Building,
  Calendar, XCircle, Shield, Info, ChevronDown, Network, Boxes, Eye, EyeOff,
  Smartphone, ClipboardList, HelpCircle, Activity, Link as LinkIcon, BadgeCheck,
  Stethoscope, FileCheck, Share2, Users, Vault, Key, Sun, Moon
} from 'lucide-react';
import styles from './RegisterHospital.module.css';
import { publicRegisterHospital } from '../services/hospitalApi';
import { registerHospitalInRegistry } from '../data/hospitals';
import { useTheme } from '../context/ThemeContext';

// ── ALL 36 INDIAN STATES & UNION TERRITORIES WITH THEIR DISTRICTS ──
const INDIA_STATES_DISTRICTS = {
  'Andhra Pradesh': ['Allagadda', 'Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Kakinada', 'Krishna', 'Kurnool', 'NTR', 'Nellore', 'Prakasam', 'Srikakulam', 'Tirupati', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa'],
  'Arunachal Pradesh': ['Anjaw', 'Changlang', 'Dibang Valley', 'East Kameng', 'East Siang', 'Itanagar Capital Complex', 'Kamle', 'Kra Daadi', 'Kurung Kumey', 'Lepa Rada', 'Lohit', 'Longding', 'Lower Dibang Valley', 'Lower Subansiri', 'Namsai', 'Pakke Kessang', 'Papum Pare', 'Shi Yomi', 'Siang', 'Tawang', 'Tirap', 'Upper Siang', 'Upper Subansiri', 'West Kameng', 'West Siang'],
  'Assam': ['Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar', 'Charaideo', 'Chirang', 'Darrang', 'Dhemaji', 'Dhubri', 'Dibrugarh', 'Dima Hasao', 'Goalpara', 'Golaghat', 'Hailakandi', 'Hojai', 'Jorhat', 'Kamrup', 'Kamrup Metropolitan (Guwahati)', 'Karbi Anglong', 'Karimganj', 'Kokrajhar', 'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon', 'Nalbari', 'Sivasagar', 'Sonitpur', 'South Salmara-Mankachar', 'Tinsukia', 'Udalguri', 'West Karbi Anglong'],
  'Bihar': ['Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar', 'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur', 'Saran', 'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul', 'Vaishali', 'West Champaran'],
  'Chhattisgarh': ['Balod', 'Baloda Bazar', 'Balrampur', 'Bastar', 'Bemetara', 'Bijapur', 'Bilaspur', 'Dantewada', 'Dhamtari', 'Durg', 'Gariaband', 'Gaurela-Pendra-Marwahi', 'Janjgir-Champa', 'Jashpur', 'Kabirdham', 'Kanker', 'Kondagaon', 'Korba', 'Koriya', 'Mahasamund', 'Manendragarh', 'Mohla-Manpur', 'Mungeli', 'Narayanpur', 'Raigarh', 'Raipur', 'Rajnandgaon', 'Sukma', 'Surajpur', 'Surguja'],
  'Goa': ['North Goa (Panaji)', 'South Goa (Margao)'],
  'Gujarat': ['Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhumi Dwarka', 'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi', 'Vadodara', 'Valsad'],
  'Haryana': ['Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram', 'Hissar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh', 'Nuh', 'Palwal', 'Panchkula', 'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar'],
  'Himachal Pradesh': ['Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu', 'Lahaul and Spiti', 'Mandi', 'Shimla', 'Sirmaur', 'Solan', 'Una'],
  'Jharkhand': ['Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum (Jamshedpur)', 'Garhwa', 'Giridih', 'Godda', 'Gumla', 'Hazaribagh', 'Jamtara', 'Khunti', 'Koderma', 'Latehar', 'Lohardaga', 'Pakur', 'Palamu', 'Ramgarh', 'Ranchi', 'Sahibganj', 'Saraikela Kharsawan', 'Simdega', 'West Singhbhum'],
  'Karnataka': ['Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada (Mangaluru)', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Vijayapura', 'Yadgir'],
  'Kerala': ['Alappuzha', 'Ernakulam (Kochi)', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'],
  'Madhya Pradesh': ['Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani', 'Betul', 'Bhind', 'Bhopal', 'Burhanpur', 'Chhatarpur', 'Chhindwara', 'Damoh', 'Datia', 'Dewas', 'Dhar', 'Dindori', 'Guna', 'Gwalior', 'Harda', 'Hoshangabad (Narmadapuram)', 'Indore', 'Jabalpur', 'Jhabua', 'Katni', 'Khandwa', 'Khargone', 'Mandla', 'Mandsaur', 'Morena', 'Narsinghpur', 'Neemuch', 'Panna', 'Raisen', 'Rajgarh', 'Ratlam', 'Rewa', 'Sagar', 'Satna', 'Sehore', 'Seoni', 'Shahdol', 'Shajapur', 'Sheopur', 'Shivpuri', 'Sidhi', 'Singrauli', 'Tikamgarh', 'Ujjain', 'Umaria', 'Vidisha'],
  'Maharashtra': ['Ahmednagar', 'Akola', 'Amravati', 'Chhatrapati Sambhaji Nagar (Aurangabad)', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Dharashiv (Osmanabad)', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'],
  'Manipur': ['Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West', 'Jiribam', 'Kakching', 'Kamjong', 'Kangpokpi', 'Noney', 'Pherzawl', 'Senapati', 'Tamenglong', 'Tengnoupal', 'Thoubal', 'Ukhrul'],
  'Meghalaya': ['East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills (Shillong)', 'Eastern West Khasi Hills', 'North Garo Hills', 'Ri Bhoi', 'South Garo Hills', 'South West Garo Hills', 'South West Khasi Hills', 'West Garo Hills', 'West Jaintia Hills', 'West Khasi Hills'],
  'Mizoram': ['Aizawl', 'Champhai', 'Hnahthial', 'Khawzawl', 'Kolasib', 'Lawngtlai', 'Lunglei', 'Mamit', 'Saitual', 'Serchhip', 'Siaha'],
  'Nagaland': ['Chümoukedima', 'Dimapur', 'Kiphire', 'Kohima', 'Longleng', 'Mokokchung', 'Mon', 'Niuland', 'Noklak', 'Peren', 'Phek', 'Shamator', 'Tseminyu', 'Tuensang', 'Wokha', 'Zunheboto'],
  'Odisha': ['Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Baudh', 'Cuttack', 'Deogarh', 'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapara', 'Kendujhar (Keonjhar)', 'Khordha (Bhubaneswar)', 'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh', 'Nuapada', 'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh'],
  'Punjab': ['Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka', 'Firozpur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 'Malerkotla', 'Mansa', 'Moga', 'Muktsar', 'Pathankot', 'Patiala', 'Rupnagar', 'Sahibzada Ajit Singh Nagar (Mohali)', 'Sangrur', 'Shahid Bhagat Singh Nagar (Nawanshahr)', 'Tarn Taran'],
  'Rajasthan': ['Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur', 'Hanumangarh', 'Jaipur', 'Jaisalmer', 'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur', 'Karauli', 'Kota', 'Nagaur', 'Pali', 'Pratapgarh', 'Rajsamand', 'Sawai Madhopur', 'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur'],
  'Sikkim': ['Gangtok', 'Gyalshing', 'Mangan', 'Namchi', 'Pakyong', 'Soreng'],
  'Tamil Nadu': ['Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'],
  'Telangana': ['Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam', 'Kumuram Bheem Asifabad', 'Mahabubabad', 'Mahbubnagar', 'Mancherial', 'Medak', 'Medchal-Malkajgiri', 'Mulugu', 'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Ranga Reddy', 'Sangareddy', 'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal', 'Hanamkonda', 'Yadadri Bhuvanagiri'],
  'Tripura': ['Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 'Unakoti', 'West Tripura (Agartala)'],
  'Uttar Pradesh': ['Agra', 'Aligarh', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Ayodhya', 'Azamgarh', 'Baghpat', 'Bahraich', 'Ballia', 'Balrampur', 'Banda', 'Barabanki', 'Bareilly', 'Basti', 'Bhadohi', 'Bijnor', 'Budaun', 'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah', 'Etawah', 'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gautam Buddha Nagar (Noida)', 'Ghaziabad', 'Ghazipur', 'Gonda', 'Gorakhpur', 'Hamirpur', 'Hapur', 'Hardoi', 'Hathras', 'Jalaun', 'Jaunpur', 'Jhansi', 'Kannauj', 'Kanpur Dehat', 'Kanpur Nagar', 'Kasganj', 'Kaushambi', 'Kheri (Lakhimpur)', 'Kushinagar', 'Lalitpur', 'Lucknow', 'Maharajganj', 'Mahoba', 'Mainpuri', 'Mathura', 'Mau', 'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Pratapgarh', 'Prayagraj (Allahabad)', 'Raebareli', 'Rampur', 'Saharanpur', 'Sambhal', 'Sant Kabir Nagar', 'Shahjahanpur', 'Shamli', 'Shravasti', 'Siddharthnagar', 'Sitapur', 'Sonbhadra', 'Sultanpur', 'Unnao', 'Varanasi'],
  'Uttarakhand': ['Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 'Haridwar', 'Nainital', 'Pauri Garhwal', 'Pithoragarh', 'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi'],
  'West Bengal': ['Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur', 'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram', 'Kalimpong', 'Kolkata', 'Malda', 'Murshidabad', 'Nadia', 'North 24 Parganas', 'Paschim Bardhaman', 'Paschim Medinipur', 'Purba Bardhaman', 'Purba Medinipur', 'Purulia', 'South 24 Parganas', 'Uttar Dinajpur'],
  'Andaman and Nicobar Islands': ['Nicobar', 'North and Middle Andaman', 'South Andaman (Port Blair)'],
  'Chandigarh': ['Chandigarh Sector North', 'Chandigarh Sector South'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Dadra and Nagar Haveli', 'Daman', 'Diu'],
  'Delhi (NCT)': ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi'],
  'Jammu and Kashmir': ['Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Doda', 'Ganderbal', 'Jammu', 'Kathua', 'Kishtwar', 'Kulgam', 'Kupwara', 'Poonch', 'Pulwama', 'Rajouri', 'Ramban', 'Reasi', 'Samba', 'Shopian', 'Srinagar', 'Udhampur'],
  'Ladakh': ['Kargil', 'Leh'],
  'Lakshadweep': ['Kavaratti', 'Agatti', 'Amini', 'Andrott', 'Minicoy'],
  'Puducherry': ['Karaikal', 'Mahe', 'Puducherry', 'Yanam']
};

const DRAFT_KEY = 'JeevanSetu_HospitalReg_Draft';

const validateGSTIN = (gstin, hospitalType) => {
  if (!gstin) return { status: '', text: '' };
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (regex.test(gstin)) return { status: 'success', text: 'Valid GSTIN format' };
  return { status: 'error', text: 'Invalid GSTIN (e.g. 22AAAAA0000A1Z5)' };
};

const validatePAN = (pan) => {
  if (!pan) return { status: '', text: '' };
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (regex.test(pan)) return { status: 'success', text: 'Valid PAN format' };
  return { status: 'error', text: 'Invalid PAN (e.g. ABCDE1234F)' };
};

const ValidationStatus = ({ status, text }) => {
  if (!status || !text) return null;
  const icons = {
    success: <CheckCircle2 size={13} />,
    warning: <AlertCircle size={13} />,
    error: <XCircle size={13} />
  };
  return (
    <div className={`${styles.validationStatus} ${styles[`validation${status}`]}`}>
      {icons[status]}
      <span>{text}</span>
    </div>
  );
};

const PremiumUploadCard = ({ title, fieldId, file, mandatory, requiredText, onUpload, onRemove, iconColor = "#3b82f6" }) => {
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(fieldId, e.target.files[0]);
    }
  };

  const isThota = requiredText.includes("THOTA");
  const subtextColor = mandatory && !isThota ? "#ef4444" : (isThota ? "#2563eb" : "#64748b");

  return (
    <div className={styles.uploadListRow}>
      <div className={styles.uploadListIconBox}>
        <FileText size={20} color={iconColor} />
      </div>
      
      <div className={styles.uploadListTextCol}>
        <div className={styles.uploadListTitle}>{title}</div>
        <div className={styles.uploadListSubtext} style={{ color: subtextColor }}>
          {requiredText}
        </div>
      </div>

      <div className={styles.uploadListRight}>
        {file ? (
          <div className={styles.uploadListSuccess}>
            <div className={styles.uploadListFileDetails}>
              <CheckCircle2 size={16} color="#10b981" />
              <span className={styles.uploadListFileName}>{file.name}</span>
            </div>
            <button className={styles.uploadListBtnRemove} onClick={(e) => { e.preventDefault(); onRemove(fieldId); }}>
              Remove
            </button>
          </div>
        ) : (
          <label className={styles.uploadListBtn}>
            <Upload size={14} />
            <span>Upload File</span>
            <input type="file" style={{ display: 'none' }} onChange={handleFileChange} />
          </label>
        )}
      </div>
    </div>
  );
};

const RegisterHospital = () => {
  const navigate = useNavigate();
  const { isDayMode, toggleTheme } = useTheme();
  
  const defaultFormData = {
    // Step 1
    hospitalLegalName: '',
    tradeName: '',
    establishmentYear: '',
    hospitalType: 'Government',
    
    // Step 2
    addressLine1: '',
    addressLine2: '',
    state: '',
    district: '',
    pin: '',
    officialEmail: '',
    landline: '',
    nodalMobile: '',
    accountHolderName: '',
    primaryFundingSource: '',

    // Step 3
    healthAuthRegNo: '',
    gstin: '',
    pan: '',
    cin: '',
    pmjayId: '',
    abdmHfrId: '',

    // Step 4
    isNabhAccredited: true,
    nabhNumber: '',
    nabhValidUntil: '',

    // Step 5
    isThotaRegistered: true,
    thotaRegNumber: '',
    issuingAuthority: '',
    thotaValidUntil: '',
    thotaAuthTypes: ['Transplant Centre', 'Retrieval Centre Only'],
    approvedOrgans: ['Kidney', 'Liver', 'Heart', 'Lung'],
    nottoId: '',
    sottoId: '',
    rottoId: '',
    futureThotaIntent: false,
    proposedThotaType: '',

    // Step 6
    headName: '',
    headRegNo: '',
    headEmail: '',
    headMobile: '',
    coordName: '',
    coordQualification: '',
    coordEmail: '',
    coordMobile: '',

    // Step 7
    icuBeds: '',
    ventilators: '',
    bloodBankType: 'In-house',
    bloodBankLicense: '',
    tieupHospitalName: '',
    operatingTheatres: '',

    // Step 8 (File URLs/Names would be stored here for draft, but for now we skip file objects in localStorage)
    docStateHealth: null,
    docThotaCert: null,
    docNottoId: null,
    docNabhCert: null,
    docBloodBank: null,
    docMsId: null,
    docCoordAppt: null,
    docApprovedOrgans: null,
    docDsc: null,

    // Step 9
    declareTrue: false,
    declareThotaComply: false,
    declareLegalTerms: false,

    // Step 10
    loginEmail: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [highestStep, setHighestStep] = useState(1);
  const [returnToStep, setReturnToStep] = useState(null);
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const dropdownRef = useRef(null);


  const [registrationId, setRegistrationId] = useState('');
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hospitalCode, setHospitalCode] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });
  const [showPassword, setShowPassword] = useState(false);

  // ─── FORM STATE ───
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.highestStep) setHighestStep(parsed.highestStep);
        if (parsed.registrationId) setRegistrationId(parsed.registrationId);

        return { ...defaultFormData, ...parsed.formData };
      } catch (e) {
        return defaultFormData;
      }
    }
    return defaultFormData;
  });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: (y / (rect.height / 2)) * -8,
      y: (x / (rect.width / 2)) * 8
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Save to LocalStorage on form/step change
  useEffect(() => {
    const now = new Date();

    
    let newRegId = registrationId;
    if (formData.hospitalLegalName && !registrationId) {
       newRegId = `JSH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
       setRegistrationId(newRegId);
    }

    const draftData = { ...formData };
    // Omit file objects from localStorage to prevent stringify errors
    ['docStateHealth', 'docThotaCert', 'docNottoId', 'docNabhCert', 'docBloodBank', 'docMsId', 'docCoordAppt', 'docApprovedOrgans', 'docDsc'].forEach(k => delete draftData[k]);

    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      formData: draftData,
      currentStep,
      highestStep,
      registrationId: newRegId,
      savedAt: now.toISOString()
    }));
  }, [formData, currentStep, highestStep]);

  const checkPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length > 11) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score < 3) return { score, text: 'Weak', color: '#ef4444' };
    if (score < 5) return { score, text: 'Good', color: '#f59e0b' };
    return { score, text: 'Strong', color: '#10b981' };
  };

  const handleFillMockData = () => {
    const r = Math.floor(1000 + Math.random() * 9000);
    const createDummyFile = (name) => new File(["dummy content"], name, { type: "application/pdf" });
    
    setFormData(prev => ({
      ...prev,
      hospitalLegalName: `Apollo Hospitals Mock ${r}`,
      tradeName: `Apollo Group ${r}`,
      establishmentYear: '1995',
      hospitalType: 'Private',
      
      addressLine1: `123 Health Ave, Block ${r}`,
      addressLine2: 'Sector 5',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      pin: '560001',
      officialEmail: `admin${r}@apollo.mock.com`,
      landline: `0802345${r}`,
      nodalMobile: `987654${r}`,
      accountHolderName: 'Apollo Trust',
      primaryFundingSource: 'Private Equity',
      
      healthAuthRegNo: `HARN-KA-${r}`,
      gstin: `29ABCDE1234F1Z${r % 9}`,
      pan: `ABCDE123${r % 9}F`,
      cin: `U85110KA1995PTC018${r}`,
      pmjayId: `PMJAY-${r}`,
      abdmHfrId: `HFR-ABDM-${r}`,
      
      isNabhAccredited: true,
      nabhNumber: `NABH-HP-${r}`,
      nabhValidUntil: '2028-12-31',
      
      isThotaRegistered: true,
      thotaRegNumber: `THOTA-KA-${r}`,
      issuingAuthority: 'State Auth',
      thotaValidUntil: '2028-12-31',
      thotaAuthTypes: ['Transplant Centre'],
      approvedOrgans: ['Kidney', 'Liver'],
      nottoId: `NOTTO-H-${r}`,
      sottoId: `SOTTO-KA-${r}`,
      rottoId: `ROTTO-S-${r}`,
      
      headName: `Dr. Ramesh ${r}`,
      headRegNo: `MCI-${r}`,
      headEmail: `head${r}@apollo.mock.com`,
      headMobile: `912345${r}`,
      coordName: `Dr. Suresh ${r}`,
      coordQualification: 'MS Surgery',
      coordEmail: `coord${r}@apollo.mock.com`,
      coordMobile: `998877${r % 1000 + 1000}`,
      
      icuBeds: '50',
      ventilators: '20',
      bloodBankType: 'In-house',
      bloodBankLicense: `BB-${r}`,
      tieupHospitalName: '',
      otCount: '10',

      docStateHealth: createDummyFile('state_health.pdf'),
      docThotaCert: createDummyFile('thota_cert.pdf'),
      docNottoId: createDummyFile('notto_id.pdf'),
      docNabhCert: createDummyFile('nabh_cert.pdf'),
      docBloodBank: createDummyFile('blood_bank.pdf'),
      docMsId: createDummyFile('ms_id.pdf'),
      docCoordAppt: createDummyFile('coord_appt.pdf'),
      docApprovedOrgans: createDummyFile('approved_organs.pdf'),
      docDsc: createDummyFile('dsc_auth.pdf'),
      
      declareTrue: true,
      declareThotaComply: true,
      declareLegalTerms: true,
      
      loginEmail: `admin${r}@apollo.mock.com`,
      password: 'MockPassword@123',
      confirmPassword: 'MockPassword@123',
      displayName: `Admin Apollo ${r}`
    }));
    
    setPasswordStrength({ score: 5, text: 'Strong', color: '#10b981' });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const toggleThotaAuthType = (typeVal) => {
    setFormData(prev => {
      const exists = prev.thotaAuthTypes.includes(typeVal);
      if (exists) {
        return { ...prev, thotaAuthTypes: prev.thotaAuthTypes.filter(t => t !== typeVal) };
      } else {
        return { ...prev, thotaAuthTypes: [...prev.thotaAuthTypes, typeVal] };
      }
    });
  };

  const toggleOrganSelect = (organ) => {
    setFormData(prev => {
      const exists = prev.approvedOrgans.includes(organ);
      if (exists) {
        return { ...prev, approvedOrgans: prev.approvedOrgans.filter(o => o !== organ) };
      } else {
        return { ...prev, approvedOrgans: [...prev.approvedOrgans, organ] };
      }
    });
  };

  const handleFileUpload = (fieldId, file) => {
    setFormData(prev => ({ ...prev, [fieldId]: file }));
  };

  const handleFileRemove = (fieldId) => {
    setFormData(prev => {
      const newData = { ...prev };
      delete newData[fieldId];
      return newData;
    });
  };

  const handleNextStep = (e) => {
    if (e) e.preventDefault();
    
    // Return to Step 10 logic if we were just editing a step
    if (returnToStep && currentStep < 10) {
       setCurrentStep(10);
       setReturnToStep(null);
       return;
    }

    if (currentStep < 10) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (next > highestStep) {
         setHighestStep(next);
      }
    } else {
      setShowSubmitConfirm(true); // Open confirmation dialog instead of submitting directly
    }
  };

  const handleEditSection = (stepId) => {
    setReturnToStep(10);
    setCurrentStep(stepId);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const stepsList = [
    { id: 1, name: 'Basic Details' },
    { id: 2, name: 'Address & Contact' },
    { id: 3, name: 'Legal & Financial' },
    { id: 4, name: 'Accreditation & Quality' },
    { id: 5, name: 'THOTA Status' },
    { id: 6, name: 'Key Personnel' },
    { id: 7, name: 'Infrastructure' },
    { id: 8, name: 'Documents' },
    { id: 9, name: 'Declarations' },
    { id: 10, name: 'Account Setup' }
  ];

  return (
    <div className={styles.pageContainer} data-theme={isDayMode ? 'day' : 'night'}>

      {/* ── TOP NAVIGATION NAVBAR ── */}
      <nav className={styles.navbar}>
        <Link to="/" className={styles.navLogo}>
          <div className={styles.logoIconWrapper}>
            <HeartPulse size={22} strokeWidth={2.5} />
          </div>
          <div className={styles.logoTextGroup}>
            <span className={styles.brandName}>JeevanSetu</span>
            <span className={styles.brandTagline}>Secure. Connect. Save Lives.</span>
          </div>
        </Link>

        <div className={styles.navLinks}>
          <Link to="/" className={`${styles.navLink} ${styles.navLinkActive}`}>
            Home
            <div className={styles.activeIndicator} />
          </Link>
        </div>

        <div className={styles.navRight} ref={dropdownRef} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button" 
            className={styles.themeToggleBtn} 
            onClick={toggleTheme}
            title={isDayMode ? "Switch to Night Mode" : "Switch to Day Mode"}
          >
            {isDayMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <button 
            type="button" 
            className={styles.portalDropdownBtn}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Plus size={16} className={styles.dropdownIconGreen} />
            <span>Hospital Login</span>
            <ChevronDown size={14} />
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <Link to="/login?role=network" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                <Network size={16} className={styles.dropdownIconGreen} /> Network Portal
              </Link>
              <Link to="/login?role=hospital" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                <Building2 size={16} className={styles.dropdownIconGreen} /> Hospital Portal
              </Link>
              <Link to="/login?role=admin" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                <ShieldCheck size={16} className={styles.dropdownIconGreen} /> Admin Portal
              </Link>
              <Link to="/register-hospital" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                <Plus size={16} className={styles.dropdownIconGreen} /> Register Hospital
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── MAIN CENTERED SPLIT CARD CONTAINER ── */}
      <main className={styles.mainCard}>

        {/* ── LEFT SHOWCASE PANEL ── */}
        <div className={styles.leftPanel}>
          <div>
            <div className={styles.topBadgePill}>
              <div className={styles.badgeShieldIcon}>
                <Plus size={11} strokeWidth={3} />
              </div>
              <span>IN TRANSIT</span>
            </div>

            <h1 className={styles.mainHeadline}>
              Every Organ. Every Mile.<br />
              <span className={styles.highlightGreen}>Every Life Matters.</span>
            </h1>
            <div className={styles.leftSubtitle}>Real-time. Secure. Transparent.</div>
            <div className={styles.greenAccentBar} />
          </div>

          <div 
            className={styles.stage3D}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ 
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
              transition: tilt.x === 0 ? 'transform 0.5s ease' : 'none'
            }}
          >
            <img src="/hospital_3d.png" alt="Hospital Facility" className={styles.hospitalImg} />
          </div>

          {/* Journey Timeline */}
          <div className={styles.processBarContainer}>
            {[
              { label: 'Organ Donated', active: false },
              { label: 'Verified', active: false },
              { label: 'Secure Transport', active: false },
              { label: 'In Transit', active: false },
              { label: 'Organ Received', active: false },
              { label: 'Transplant Successful', active: false },
              { label: 'Life Saved', active: true }
            ].map((step, idx, arr) => (
              <React.Fragment key={idx}>
                <div className={styles.processStepNode}>
                  <div className={step.active ? styles.stepIconCircleActive : styles.stepIconCircle}>
                    {step.active ? <HeartPulse size={16} /> : <CheckCircle2 size={13} />}
                  </div>
                  <span className={step.active ? styles.stepNodeLabelActive : styles.stepNodeLabel}>
                    {step.label.split(' ')[0]}
                  </span>
                </div>
                {idx < arr.length - 1 && <span className={styles.dottedLine}>••••</span>}
              </React.Fragment>
            ))}
          </div>

          {/* Bottom Security Row */}
          <div className={styles.leftBottomSecurityRow}>
            <div className={styles.securityPillItem}>
              <Lock size={12} className={styles.securityPillIcon} />
              <span>End to End Encryption</span>
            </div>
            <div className={styles.securityPillItem}>
              <ShieldCheck size={12} className={styles.securityPillIcon} />
              <span>THOTA Compliant</span>
            </div>
            <div className={styles.securityPillItem}>
              <LinkIcon size={12} className={styles.securityPillIcon} />
              <span>Blockchain Verified</span>
            </div>
            <div className={styles.securityPillItem}>
              <Activity size={12} className={styles.securityPillIcon} />
              <span>Real Time Tracking</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL (MULTI-STEP REGISTRATION FORM) ── */}
        <div className={styles.rightPanel}>
          <div className={styles.registerFormCard}>
            {/* Form Top Header Row */}
            <div className={styles.formTopHeaderRow}>
                <div className={styles.topBadgePill} style={{ margin: 0 }}>
                  <div className={styles.badgeShieldIcon}>
                    <Plus size={11} strokeWidth={3} />
                  </div>
                  <span>IN TRANSIT</span>
                </div>

                <div className={styles.progressTrackerContainer}>
                  <button 
                    onClick={handleFillMockData} 
                    type="button"
                    style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginRight: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ClipboardList size={14} /> Auto-fill Demo Data
                  </button>
                  {/* Removed Draft Saved text as requested */}
                  {currentStep === 10 ? (
                    <div className={styles.stepCountBadge}>
                      Step 10 of 10
                    </div>
                  ) : (
                    <div className={styles.progressTracker}>
                      <div className={styles.progressText}>
                        {Math.floor(((currentStep - 1) / 10) * 100)}% Complete
                      </div>
                      <div className={styles.progressBarWrapper}>
                        <div 
                          className={styles.progressBarFill} 
                          style={{ width: `${Math.floor(((currentStep - 1) / 10) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <h2 className={styles.formMainTitle}>Hospital Registration</h2>
              <div className={styles.formMainSubtitle}>Join our network and help save more lives.</div>

              {/* 9-Step Horizontal Progress Stepper Bar */}
              <div className={styles.stepperOuterRow}>
                <div className={styles.stepperBarContainer}>
                  {stepsList.map((step, idx) => {
                    const isActive = step.id === currentStep;
                    const isPassed = step.id < currentStep;
                    const isLocked = step.id > highestStep;
                    return (
                      <React.Fragment key={step.id}>
                        <div 
                          className={styles.stepperNode}
                          onClick={() => {
                            if (!isLocked) setCurrentStep(step.id);
                          }}
                          style={{ opacity: isLocked ? 0.5 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                          title={isLocked ? 'Complete previous steps first' : step.name}
                        >
                          <div className={`${styles.stepperCircle} ${isActive ? styles.stepperCircleActive : ''} ${isPassed ? styles.stepperCircleCompleted : ''}`}>
                            {isPassed ? <Check size={13} strokeWidth={3} /> : step.id}
                          </div>
                          <span className={isActive ? styles.stepperLabelActive : styles.stepperLabel}>
                            {step.name.split(' ')[0]}
                          </span>
                        </div>
                        {idx < stepsList.length - 1 && (
                          <span className={styles.dottedLine} style={{ color: isPassed ? '#10b981' : '#cbd5e1' }}>
                            ••••
                          </span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* ── MULTI-STEP FORM SCROLLABLE AREA ── */}
              <div className={styles.innerFormCardBox} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  <div className={styles.formScrollableArea}>

                    {/* STEP 1: BASIC HOSPITAL DETAILS */}
                    {currentStep === 1 && (
                      <div>
                        <div className={styles.sectionHeaderBox}>
                          <div className={styles.sectionHeaderIcon}><Building2 size={20} /></div>
                          <div>
                            <div className={styles.sectionTitle}>Basic Hospital Details</div>
                            <div className={styles.sectionSubtitle}>Provide your hospital's basic information.</div>
                          </div>
                        </div>

                        <div className={styles.inputGrid}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Hospital Legal Name <span style={{ color: '#ef4444' }}>*</span></label>
                            <input 
                              type="text" 
                              className={styles.inputField} 
                              placeholder="Enter legal name of the hospital" 
                              value={formData.hospitalLegalName} 
                              onChange={(e) => handleInputChange('hospitalLegalName', e.target.value)} 
                              required 
                            />
                          </div>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Hospital Trade / Brand Name</label>
                            <input 
                              type="text" 
                              className={styles.inputField} 
                              placeholder="Enter trade or brand name (optional)" 
                              value={formData.tradeName} 
                              onChange={(e) => handleInputChange('tradeName', e.target.value)} 
                            />
                          </div>
                        </div>

                        <div className={styles.inputGrid}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Year of Establishment</label>
                            <select className={styles.inputField} value={formData.establishmentYear} onChange={(e) => handleInputChange('establishmentYear', e.target.value)}>
                              <option value="">Select year (optional)</option>
                              {Array.from({ length: 75 }, (_, i) => 2026 - i).map(yr => (
                                <option key={yr} value={yr}>{yr}</option>
                              ))}
                            </select>
                          </div>

                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Hospital Type <span style={{ color: '#ef4444' }}>*</span></label>
                            <div className={styles.hospitalTypeCardsGrid}>
                              <div 
                                className={`${styles.hospitalTypeCard} ${formData.hospitalType === 'Government' ? styles.hospitalTypeCardSelected : ''}`}
                                onClick={() => handleInputChange('hospitalType', 'Government')}
                              >
                                {formData.hospitalType === 'Government' && <div className={styles.checkCircle}><Check size={14} strokeWidth={3} /></div>}
                                <div className={styles.iconWrapper} style={{ color: '#10b981', background: '#ecfdf5' }}><Landmark size={28} /></div>
                                <span className={styles.hospitalTypeLabel}>Government</span>
                              </div>

                              <div 
                                className={`${styles.hospitalTypeCard} ${formData.hospitalType === 'Private' ? styles.hospitalTypeCardSelected : ''}`}
                                onClick={() => handleInputChange('hospitalType', 'Private')}
                              >
                                {formData.hospitalType === 'Private' && <div className={styles.checkCircle}><Check size={14} strokeWidth={3} /></div>}
                                <div className={styles.iconWrapper} style={{ color: '#2563eb', background: '#eff6ff' }}><Building2 size={28} /></div>
                                <span className={styles.hospitalTypeLabel}>Private</span>
                              </div>

                              <div 
                                className={`${styles.hospitalTypeCard} ${formData.hospitalType === 'Trust' ? styles.hospitalTypeCardSelected : ''}`}
                                onClick={() => handleInputChange('hospitalType', 'Trust')}
                              >
                                {formData.hospitalType === 'Trust' && <div className={styles.checkCircle}><Check size={14} strokeWidth={3} /></div>}
                                <div className={styles.iconWrapper} style={{ color: '#f97316', background: '#fff7ed' }}><Heart size={28} /></div>
                                <span className={styles.hospitalTypeLabel}>Trust</span>
                              </div>

                              <div 
                                className={`${styles.hospitalTypeCard} ${formData.hospitalType === 'Corporate' ? styles.hospitalTypeCardSelected : ''}`}
                                onClick={() => handleInputChange('hospitalType', 'Corporate')}
                              >
                                {formData.hospitalType === 'Corporate' && <div className={styles.checkCircle}><Check size={14} strokeWidth={3} /></div>}
                                <div className={styles.iconWrapper} style={{ color: '#9333ea', background: '#faf5ff' }}><Building size={28} /></div>
                                <span className={styles.hospitalTypeLabel}>Corporate</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: ADDRESS & CONTACT */}
                    {currentStep === 2 && (
                      <div>
                        <div className={styles.sectionHeaderBox}>
                          <div className={styles.sectionHeaderIcon} style={{ color: '#2563eb' }}><MapPin size={20} /></div>
                          <div>
                            <div className={styles.sectionTitle}>Address & Contact</div>
                            <div className={styles.sectionSubtitle}>Provide your hospital's official address and contact details.</div>
                          </div>
                        </div>

                        <div className={styles.inputGrid}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Address Line 1 <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="text" className={styles.inputField} placeholder="Enter address line 1" value={formData.addressLine1} onChange={(e) => handleInputChange('addressLine1', e.target.value)} required />
                          </div>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Address Line 2 (Optional)</label>
                            <input type="text" className={styles.inputField} placeholder="Enter address line 2" value={formData.addressLine2} onChange={(e) => handleInputChange('addressLine2', e.target.value)} />
                          </div>
                        </div>

                        <div className={styles.inputGrid3Col}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>District <span style={{ color: '#ef4444' }}>*</span></label>
                            <select className={styles.inputField} value={formData.district} onChange={(e) => handleInputChange('district', e.target.value)} required>
                              <option value="">Select district</option>
                              {(INDIA_STATES_DISTRICTS[formData.state] || []).map(dt => (
                                <option key={dt} value={dt}>{dt}</option>
                              ))}
                            </select>
                          </div>

                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>State <span style={{ color: '#ef4444' }}>*</span></label>
                            <select 
                              className={styles.inputField} 
                              value={formData.state} 
                              onChange={(e) => {
                                handleInputChange('state', e.target.value);
                                const dists = INDIA_STATES_DISTRICTS[e.target.value] || [];
                                handleInputChange('district', dists[0] || '');
                              }}
                              required
                            >
                              <option value="">Select state</option>
                              {Object.keys(INDIA_STATES_DISTRICTS).map(st => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                          </div>

                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>PIN Code <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="text" className={styles.inputField} placeholder="Enter PIN code" value={formData.pin} onChange={(e) => handleInputChange('pin', e.target.value)} required />
                          </div>
                        </div>

                        <div className={styles.inputGroup}>
                          <label>Official Hospital Email <span className={styles.required}>*</span></label>
                          <div className={`${styles.inputFieldWrapper} ${styles.emailWrapper}`}>
                            <Mail size={16} className={styles.inputFieldIcon} />
                            <input 
                              type="email" 
                              className={`${styles.inputField} ${styles.inputFieldWithIcon} ${formData.officialEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.officialEmail) ? styles.inputFieldValid : ''}`}
                              placeholder="admin@hospital.com" 
                              value={formData.officialEmail}
                              onChange={(e) => handleInputChange('officialEmail', e.target.value)}
                            />
                            {formData.officialEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.officialEmail) && (
                              <CheckCircle2 size={16} className={styles.validCheckIcon} />
                            )}
                          </div>
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Official Landline / Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                          <div className={styles.inputFieldWrapper}>
                            <Phone size={16} className={styles.inputFieldIcon} />
                            <input type="text" className={`${styles.inputField} ${styles.inputFieldWithIcon}`} placeholder="Enter landline / phone number" value={formData.landline} onChange={(e) => handleInputChange('landline', e.target.value)} required />
                          </div>
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Official Mobile Number (Nodal Officer / Transplant Coordinator) <span style={{ color: '#ef4444' }}>*</span></label>
                          <div className={styles.inputFieldWrapper}>
                            <Smartphone size={16} className={styles.inputFieldIcon} />
                            <input type="text" className={`${styles.inputField} ${styles.inputFieldWithIcon}`} placeholder="Enter official mobile number" value={formData.nodalMobile} onChange={(e) => handleInputChange('nodalMobile', e.target.value)} required />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: LEGAL & FINANCIAL IDENTIFIERS */}
                    {currentStep === 3 && (
                      <div>
                        <div className={styles.sectionHeaderBox} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className={styles.sectionHeaderIcon} style={{ color: '#059669' }}><FileCheck2 size={20} /></div>
                            <div>
                              <div className={styles.sectionTitle}>Legal & Financial Identifiers</div>
                              <div className={styles.sectionSubtitle}>Verify your legal identity and regulatory compliance.</div>
                            </div>
                          </div>
                          <div className={styles.mandatoryHeaderBadge}>
                            <CheckCircle2 size={13} />
                            <span>All fields marked with <span style={{ color: '#ef4444' }}>*</span> are mandatory</span>
                          </div>
                        </div>

                        {/* State Health Authority Hospital Registration Number */}
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>
                            State Health Authority Hospital Registration Number <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <div className={styles.inputFieldWrapper}>
                            <ShieldCheck size={16} className={styles.inputFieldIcon} style={{ color: '#10b981' }} />
                            <input 
                              type="text" 
                              className={`${styles.inputField} ${styles.inputFieldWithIcon}`} 
                              placeholder="Enter registration number" 
                              value={formData.healthAuthRegNo} 
                              onChange={(e) => handleInputChange('healthAuthRegNo', e.target.value)} 
                              required 
                            />
                          </div>
                          <div className={styles.fieldSubtext}>Certificate issued by State Health Authority</div>
                        </div>

                        {/* Hospital Type & GSTIN */}
                        <div className={styles.inputGrid}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Hospital Type (from Basic Details)</label>
                            <select 
                              className={styles.inputField} 
                              value={formData.hospitalType} 
                              onChange={(e) => handleInputChange('hospitalType', e.target.value)}
                            >
                              <option value="Government">Government Hospital</option>
                              <option value="Private">Private Hospital</option>
                              <option value="Trust">Trust Hospital</option>
                              <option value="Corporate">Corporate Hospital</option>
                            </select>
                          </div>

                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel} style={{ justifyContent: 'space-between' }}>
                              <span>GSTIN {formData.hospitalType !== 'Government' && <span style={{ color: '#ef4444' }}>*</span>}</span>
                              <button 
                                type="button" 
                                className={styles.infoIconButton}
                                onClick={() => setActiveTooltip(activeTooltip === 'gstin' ? null : 'gstin')}
                                title="Click for info"
                              >
                                <Info size={14} className={styles.labelInfoIcon} />
                              </button>
                            </label>
                            <div className={styles.inputFieldWrapper}>
                              <FileText size={16} className={styles.inputFieldIcon} style={{ color: '#10b981' }} />
                              <input 
                                type="text" 
                                className={`${styles.inputField} ${styles.inputFieldWithIcon}`} 
                                placeholder="15-digit GSTIN" 
                                value={formData.gstin}
                                onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                                maxLength={15}
                              />
                            </div>
                            {activeTooltip === 'gstin' && (
                              <div className={styles.amberNoticeBadge}>
                                <AlertCircle size={14} />
                                <span>Optional for Govt Hospitals</span>
                              </div>
                            )}
                            <ValidationStatus {...validateGSTIN(formData.gstin, formData.hospitalType)} />
                          </div>
                        </div>

                        {/* PAN & CIN */}
                        <div className={styles.inputGrid}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>
                              PAN <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div className={styles.inputFieldWrapper}>
                              <FileText size={16} className={styles.inputFieldIcon} style={{ color: '#10b981' }} />
                              <input 
                                type="text" 
                                className={`${styles.inputField} ${styles.inputFieldWithIcon}`} 
                                placeholder="Enter 10-digit PAN" 
                                value={formData.pan}
                                onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                                maxLength={10}
                              />
                            </div>
                            {formData.pan && <ValidationStatus {...validatePAN(formData.pan)} />}
                          </div>

                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel} style={{ justifyContent: 'space-between' }}>
                              <span>CIN (Corporate Identification Number)</span>
                              <button 
                                type="button" 
                                className={styles.infoIconButton}
                                onClick={() => setActiveTooltip(activeTooltip === 'cin' ? null : 'cin')}
                                title="Click for info"
                              >
                                <Info size={14} className={styles.labelInfoIcon} />
                              </button>
                            </label>
                            <input 
                              type="text" 
                              className={styles.inputField} 
                              placeholder="Enter CIN" 
                              value={formData.cin} 
                              onChange={(e) => handleInputChange('cin', e.target.value)} 
                            />
                            {activeTooltip === 'cin' && (
                              <div className={styles.infoPopBadge}>
                                <Info size={14} />
                                <span>Required for Corporate registered hospitals only</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* PM-JAY Empanelment ID */}
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Ayushman Bharat (PM-JAY) Empanelment ID (Optional)</label>
                          <div className={styles.inputFieldWrapper}>
                            <Landmark size={16} className={styles.inputFieldIcon} style={{ color: '#10b981' }} />
                            <input 
                              type="text" 
                              className={`${styles.inputField} ${styles.inputFieldWithIcon}`} 
                              placeholder="Enter PM-JAY empanelment ID" 
                              value={formData.pmjayId} 
                              onChange={(e) => handleInputChange('pmjayId', e.target.value)} 
                            />
                          </div>
                        </div>

                        {/* ABDM HFR ID */}
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel} style={{ justifyContent: 'space-between' }}>
                            <span>ABDM Health Facility Registry (HFR) ID <span style={{ color: '#ef4444' }}>*</span></span>
                            <button 
                              type="button" 
                              className={styles.infoIconButton}
                              onClick={() => setActiveTooltip(activeTooltip === 'hfr' ? null : 'hfr')}
                              title="Click for info"
                            >
                              <Info size={14} className={styles.labelInfoIcon} />
                            </button>
                          </label>
                          <div className={styles.inputFieldWrapper}>
                            <ShieldCheck size={16} className={styles.inputFieldIcon} style={{ color: '#10b981' }} />
                            <input 
                              type="text" 
                              className={`${styles.inputField} ${styles.inputFieldWithIcon}`} 
                              placeholder="Enter HFR ID" 
                              value={formData.abdmHfrId} 
                              onChange={(e) => handleInputChange('abdmHfrId', e.target.value)} 
                              required 
                            />
                          </div>
                          {activeTooltip === 'hfr' && (
                            <div className={styles.infoPopBadge}>
                              <Info size={14} />
                              <span>Registered under Ayushman Bharat Digital Mission (ABDM)</span>
                            </div>
                          )}
                          <div className={styles.greenFieldSubtext}>
                            <CheckCircle2 size={13} />
                            <span>Strongly recommended and treated as mandatory for production.</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 4: ACCREDITATION & QUALITY */}
                    {currentStep === 4 && (
                      <div>
                        <div className={styles.accreditationHeaderCard}>
                          <div className={styles.accreditationHeaderContent}>
                            <div className={styles.sectionHeaderIcon} style={{ color: '#059669', background: '#ecfdf5', borderColor: '#a7f3d0' }}>
                              <Award size={20} />
                            </div>
                            <div>
                              <div className={styles.sectionTitle}>Accreditation & Quality</div>
                              <div className={styles.sectionSubtitle}>Provide your hospital quality certification details for compliance verification.</div>
                            </div>
                          </div>
                          <div className={styles.nabh3dBadgeGraphic}>
                            <div className={styles.nabhShieldIcon}>
                              <Award size={22} color="#ffffff" strokeWidth={2.5} />
                              <span className={styles.nabhBadgeText}>NABH</span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>
                            NABH Accreditation <span style={{ color: '#ef4444' }}>*</span>
                          </label>

                          <div className={styles.nabhCardsGrid}>
                            {/* NABH Accredited Card — Horizontal layout */}
                            <div 
                              className={`${styles.nabhCard} ${formData.isNabhAccredited ? styles.nabhCardActive : ''}`}
                              onClick={() => handleInputChange('isNabhAccredited', true)}
                            >
                              <div className={`${styles.nabhCardIconBox} ${formData.isNabhAccredited ? styles.nabhCardIconBoxActive : ''}`}>
                                <Shield size={20} />
                              </div>
                              <div className={styles.nabhCardTextArea}>
                                <div className={styles.nabhCardTitle}>NABH Accredited</div>
                                <div className={styles.nabhCardSubtext}>Verified healthcare institution</div>
                              </div>
                              <div className={styles.nabhCardSelector}>
                                {formData.isNabhAccredited ? (
                                  <CheckCircle2 size={20} color="#10b981" />
                                ) : (
                                  <div className={styles.radioEmptyCircle} />
                                )}
                              </div>
                            </div>

                            {/* Not Accredited Card */}
                            <div 
                              className={`${styles.nabhCard} ${!formData.isNabhAccredited ? styles.nabhCardActive : ''}`}
                              onClick={() => handleInputChange('isNabhAccredited', false)}
                            >
                              <div className={`${styles.nabhCardIconBox} ${!formData.isNabhAccredited ? styles.nabhCardIconBoxActive : ''}`}>
                                <Shield size={20} />
                              </div>
                              <div className={styles.nabhCardTextArea}>
                                <div className={styles.nabhCardTitle}>Not Accredited</div>
                                <div className={styles.nabhCardSubtext}>Currently not NABH certified</div>
                              </div>
                              <div className={styles.nabhCardSelector}>
                                {!formData.isNabhAccredited ? (
                                  <CheckCircle2 size={20} color="#10b981" />
                                ) : (
                                  <div className={styles.radioEmptyCircle} />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {formData.isNabhAccredited && (
                          <div className={styles.inputGrid}>
                            <div className={styles.inputGroup}>
                              <label className={styles.inputLabel}>
                                NABH Accreditation Number <span style={{ color: '#ef4444' }}>*</span>
                              </label>
                              <div className={styles.inputFieldWrapper}>
                                <input 
                                  type="text" 
                                  className={`${styles.inputField} ${formData.nabhNumber ? styles.inputFieldValid : ''}`} 
                                  placeholder="NABH-2022-4587" 
                                  value={formData.nabhNumber} 
                                  onChange={(e) => handleInputChange('nabhNumber', e.target.value)} 
                                  required 
                                />
                                {formData.nabhNumber && (
                                  <CheckCircle2 size={16} className={styles.validCheckIcon} />
                                )}
                              </div>
                              {formData.nabhNumber && (
                                <div className={styles.greenFieldSubtext} style={{ marginTop: '6px' }}>
                                  <Check size={13} strokeWidth={3} />
                                  <span>Number format looks valid</span>
                                </div>
                              )}
                            </div>

                            <div className={styles.inputGroup}>
                              <label className={styles.inputLabel}>
                                NABH Accreditation Valid Until <span style={{ color: '#ef4444' }}>*</span>
                              </label>
                              <div className={styles.inputFieldWrapper}>
                                <input 
                                  type="date" 
                                  className={styles.inputField} 
                                  value={formData.nabhValidUntil} 
                                  onChange={(e) => handleInputChange('nabhValidUntil', e.target.value)} 
                                  required 
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className={styles.complianceNoticeBox}>
                          <div className={styles.noticeIconCircle}>
                            <Info size={16} />
                          </div>
                          <div>
                            <div className={styles.noticeTitle}>Compliance Notice</div>
                            <div className={styles.noticeText}>
                              A valid NABH accreditation improves institutional trust and may be required for certain transplantation programs.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 5: THOTA STATUS */}
                    {currentStep === 5 && (
                      <div>
                        {/* Section Header */}
                        <div className={styles.sectionHeaderBox}>
                          <div className={styles.sectionHeaderIcon} style={{ color: '#2563eb', background: '#eff6ff', borderColor: '#bfdbfe' }}>
                            <ClipboardList size={18} />
                          </div>
                          <div>
                            <div className={styles.sectionTitle}>THOTA Status <span style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600 }}>(Very Important)</span></div>
                            <div className={styles.sectionSubtitle}>Please provide your hospital's registration status under THOTA.</div>
                          </div>
                        </div>

                        {/* Yes / No Toggle Cards */}
                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>
                            Is your hospital currently registered under THOTA for organ transplantation or retrieval? <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <div className={styles.nabhCardsGrid}>
                            <div
                              className={`${styles.nabhCard} ${formData.isThotaRegistered ? styles.nabhCardActive : ''}`}
                              onClick={() => handleInputChange('isThotaRegistered', true)}
                            >
                              <div className={`${styles.nabhCardIconBox} ${formData.isThotaRegistered ? styles.nabhCardIconBoxActive : ''}`}>
                                <CheckCircle2 size={18} />
                              </div>
                              <div className={styles.nabhCardTextArea}>
                                <div className={styles.nabhCardTitle}>Yes, Registered under THOTA</div>
                              </div>
                              <div className={styles.nabhCardSelector}>
                                {formData.isThotaRegistered ? (
                                  <CheckCircle2 size={18} color="#10b981" />
                                ) : (
                                  <div className={styles.radioEmptyCircle} />
                                )}
                              </div>
                            </div>

                            <div
                              className={`${styles.nabhCard} ${!formData.isThotaRegistered ? styles.nabhCardActive : ''}`}
                              onClick={() => handleInputChange('isThotaRegistered', false)}
                            >
                              <div className={`${styles.nabhCardIconBox} ${!formData.isThotaRegistered ? styles.nabhCardIconBoxActive : ''}`}>
                                <XCircle size={18} />
                              </div>
                              <div className={styles.nabhCardTextArea}>
                                <div className={styles.nabhCardTitle}>No, Not Registered</div>
                              </div>
                              <div className={styles.nabhCardSelector}>
                                {!formData.isThotaRegistered ? (
                                  <CheckCircle2 size={18} color="#10b981" />
                                ) : (
                                  <div className={styles.radioEmptyCircle} />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {formData.isThotaRegistered && (
                          <div>
                            {/* Sub-header */}
                            <div className={styles.thotaSubHeader}>THOTA Registration Details</div>

                            {/* 3-col: Reg Number | Authority | Valid Until */}
                            <div className={styles.inputGrid3Col}>
                              <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>THOTA Registration Number (Certificate of Registration) <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                  type="text"
                                  className={styles.inputField}
                                  placeholder="Enter THOTA registration number"
                                  value={formData.thotaRegNumber}
                                  onChange={(e) => handleInputChange('thotaRegNumber', e.target.value)}
                                  required
                                />
                              </div>

                              <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>Issuing State / Appropriate Authority <span style={{ color: '#ef4444' }}>*</span></label>
                                <select
                                  className={styles.inputField}
                                  value={formData.issuingAuthority}
                                  onChange={(e) => handleInputChange('issuingAuthority', e.target.value)}
                                  required
                                >
                                  <option value="">Select state / authority</option>
                                  {Object.keys(INDIA_STATES_DISTRICTS).map(st => (
                                    <option key={st} value={st}>{st}</option>
                                  ))}
                                </select>
                              </div>

                              <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>THOTA Registration Valid Until <span style={{ color: '#ef4444' }}>*</span></label>
                                <input
                                  type="date"
                                  className={styles.inputField}
                                  value={formData.thotaValidUntil}
                                  onChange={(e) => handleInputChange('thotaValidUntil', e.target.value)}
                                  required
                                />
                              </div>
                            </div>

                            {/* Type of Authorization checkboxes */}
                            <div className={styles.inputGroup}>
                              <label className={styles.inputLabel}>Type of THOTA Authorization <span style={{ color: '#94a3b8', fontWeight: 500 }}>(Select all that apply)</span> <span style={{ color: '#ef4444' }}>*</span></label>
                              <div className={styles.inlineCheckboxRow}>
                                {['Transplant Centre', 'Retrieval Centre Only', 'Both'].map(authType => {
                                  const checked = formData.thotaAuthTypes.includes(authType);
                                  return (
                                    <div
                                      key={authType}
                                      className={`${styles.inlineCheckItem} ${checked ? styles.inlineCheckItemActive : ''}`}
                                      onClick={() => toggleThotaAuthType(authType)}
                                    >
                                      <div className={`${styles.checkboxSquare} ${checked ? styles.checkboxSquareChecked : ''}`}>
                                        {checked && <Check size={11} strokeWidth={3} />}
                                      </div>
                                      <span>{authType}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Organs checkboxes */}
                            <div className={styles.inputGroup}>
                              <label className={styles.inputLabel}>Organs Approved for Transplant/Retrieval <span style={{ color: '#94a3b8', fontWeight: 500 }}>(Select all that apply)</span> <span style={{ color: '#ef4444' }}>*</span></label>
                              <div className={styles.inlineCheckboxRow} style={{ flexWrap: 'wrap' }}>
                                {['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Cornea', 'Tissue', 'Others'].map(organ => {
                                  const checked = formData.approvedOrgans.includes(organ);
                                  return (
                                    <div
                                      key={organ}
                                      className={`${styles.inlineCheckItem} ${checked ? styles.inlineCheckItemActive : ''}`}
                                      onClick={() => toggleOrganSelect(organ)}
                                    >
                                      <div className={`${styles.checkboxSquare} ${checked ? styles.checkboxSquareChecked : ''}`}>
                                        {checked && <Check size={11} strokeWidth={3} />}
                                      </div>
                                      <span>{organ}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* NOTTO / SOTTO / ROTTO IDs */}
                            <div className={styles.inputGrid3Col}>
                              <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>NOTTO Hospital ID <span style={{ color: '#ef4444' }}>*</span></label>
                                <input type="text" className={styles.inputField} placeholder="Enter NOTTO hospital ID" value={formData.nottoId} onChange={(e) => handleInputChange('nottoId', e.target.value)} required />
                              </div>
                              <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>SOTTO ID <span style={{ color: '#ef4444' }}>*</span></label>
                                <input type="text" className={styles.inputField} placeholder="Enter SOTTO ID" value={formData.sottoId} onChange={(e) => handleInputChange('sottoId', e.target.value)} required />
                              </div>
                              <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>ROTTO ID <span style={{ color: '#94a3b8', fontWeight: 500 }}>(Optional)</span></label>
                                <input type="text" className={styles.inputField} placeholder="Enter ROTTO ID (if available)" value={formData.rottoId} onChange={(e) => handleInputChange('rottoId', e.target.value)} />
                              </div>
                            </div>
                          </div>
                        )}

                        {!formData.isThotaRegistered && (
                          <div>
                            <div className={styles.inputGroup}>
                              <label className={styles.inputLabel}>Do you intend to apply for THOTA authorization in the future? <span style={{ color: '#ef4444' }}>*</span></label>
                              <div className={styles.nabhCardsGrid}>
                                <div
                                  className={`${styles.nabhCard} ${formData.futureThotaIntent ? styles.nabhCardActive : ''}`}
                                  onClick={() => handleInputChange('futureThotaIntent', true)}
                                >
                                  <div className={styles.nabhCardTextArea}>
                                    <div className={styles.nabhCardTitle}>Yes, Intend to Apply</div>
                                  </div>
                                  <div className={styles.nabhCardSelector}>
                                    {formData.futureThotaIntent ? <CheckCircle2 size={18} color="#10b981" /> : <div className={styles.radioEmptyCircle} />}
                                  </div>
                                </div>
                                <div
                                  className={`${styles.nabhCard} ${!formData.futureThotaIntent ? styles.nabhCardActive : ''}`}
                                  onClick={() => handleInputChange('futureThotaIntent', false)}
                                >
                                  <div className={styles.nabhCardTextArea}>
                                    <div className={styles.nabhCardTitle}>No</div>
                                  </div>
                                  <div className={styles.nabhCardSelector}>
                                    {!formData.futureThotaIntent ? <CheckCircle2 size={18} color="#10b981" /> : <div className={styles.radioEmptyCircle} />}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {formData.futureThotaIntent && (
                              <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>Proposed THOTA Centre Type <span style={{ color: '#ef4444' }}>*</span></label>
                                <select className={styles.inputField} value={formData.proposedThotaType} onChange={(e) => handleInputChange('proposedThotaType', e.target.value)} required>
                                  <option value="">Select proposed type</option>
                                  <option value="Transplant Centre">Transplant Centre</option>
                                  <option value="Retrieval Centre">Retrieval Centre</option>
                                  <option value="Both">Both Transplant &amp; Retrieval Centre</option>
                                </select>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* STEP 6: KEY PERSONNEL (MATCHES NEW SCREENSHOT 1) */}
                    {currentStep === 6 && (
                      <div>
                        <div className={styles.sectionHeaderBox}>
                          <div className={styles.sectionHeaderIcon} style={{ color: '#7c3aed' }}><UserCheck size={20} /></div>
                          <div>
                            <div className={styles.sectionTitle}>Key Personnel</div>
                            <div className={styles.sectionSubtitle}>Provide details of key hospital authorities and transplant team.</div>
                          </div>
                        </div>

                        {/* Subheader 1 */}
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e2937', marginBottom: 10 }}>
                          Medical Superintendent <span style={{ color: '#ef4444', fontWeight: 600 }}>(Mandatory)</span>
                        </div>

                        <div className={styles.inputGrid}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Medical Superintendent Name <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="text" className={styles.inputField} placeholder="Enter full name" value={formData.headName} onChange={(e) => handleInputChange('headName', e.target.value)} required />
                          </div>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>
                              Medical Superintendent Registration Number <span style={{ color: '#64748b', fontWeight: 500 }}>(State Medical Council)</span> <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input type="text" className={styles.inputField} placeholder="Enter registration number" value={formData.headRegNo} onChange={(e) => handleInputChange('headRegNo', e.target.value)} required />
                          </div>
                        </div>

                        <div className={styles.inputGrid}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Medical Superintendent Email <span style={{ color: '#ef4444' }}>*</span></label>
                            <div className={styles.inputFieldWrapper}>
                              <Mail size={16} className={styles.inputFieldIcon} />
                              <input type="email" className={`${styles.inputField} ${styles.inputFieldWithIcon}`} placeholder="Enter official email address" value={formData.headEmail} onChange={(e) => handleInputChange('headEmail', e.target.value)} required />
                            </div>
                          </div>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Medical Superintendent Mobile <span style={{ color: '#ef4444' }}>*</span></label>
                            <div className={styles.inputFieldWrapper}>
                              <Phone size={16} className={styles.inputFieldIcon} />
                              <input type="text" className={`${styles.inputField} ${styles.inputFieldWithIcon}`} placeholder="Enter mobile number" value={formData.headMobile} onChange={(e) => handleInputChange('headMobile', e.target.value)} required />
                            </div>
                          </div>
                        </div>

                        <div style={{ height: 1, background: '#e2e8f0', margin: '14px 0' }} />

                        {/* Subheader 2 */}
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e2937', marginBottom: 10 }}>
                          Transplant Coordinator <span style={{ color: '#7c3aed', fontWeight: 600 }}>(Required for THOTA-authorized hospitals)</span>
                        </div>

                        <div className={styles.inputGrid}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Transplant Coordinator Name <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="text" className={styles.inputField} placeholder="Enter full name" value={formData.coordName} onChange={(e) => handleInputChange('coordName', e.target.value)} required={formData.isThotaRegistered} />
                          </div>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Transplant Coordinator Qualification <span style={{ color: '#ef4444' }}>*</span></label>
                            <select className={styles.inputField} value={formData.coordQualification} onChange={(e) => handleInputChange('coordQualification', e.target.value)}>
                              <option value="">Enter qualification</option>
                              <option value="MD, Transplant Medicine">MD, Transplant Medicine</option>
                              <option value="MS, Surgery">MS, Surgery</option>
                              <option value="M.Ch, Urology / Nephrology">M.Ch, Urology / Nephrology</option>
                              <option value="Certified Transplant Coordinator">Certified Transplant Coordinator</option>
                            </select>
                          </div>
                        </div>

                        <div className={styles.inputGrid}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Transplant Coordinator Email <span style={{ color: '#ef4444' }}>*</span></label>
                            <div className={styles.inputFieldWrapper}>
                              <Mail size={16} className={styles.inputFieldIcon} />
                              <input type="email" className={`${styles.inputField} ${styles.inputFieldWithIcon}`} placeholder="Enter official email address" value={formData.coordEmail} onChange={(e) => handleInputChange('coordEmail', e.target.value)} required={formData.isThotaRegistered} />
                            </div>
                          </div>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Transplant Coordinator Mobile <span style={{ color: '#ef4444' }}>*</span></label>
                            <div className={styles.inputFieldWrapper}>
                              <Phone size={16} className={styles.inputFieldIcon} />
                              <input type="text" className={`${styles.inputField} ${styles.inputFieldWithIcon}`} placeholder="Enter mobile number" value={formData.coordMobile} onChange={(e) => handleInputChange('coordMobile', e.target.value)} required={formData.isThotaRegistered} />
                            </div>
                          </div>
                        </div>

                        <div className={styles.purpleAlertBox}>
                          <Info size={16} />
                          <span>Transplant Coordinator details are mandatory for THOTA-authorized hospitals.</span>
                        </div>
                      </div>
                    )}

                    {/* STEP 7: INFRASTRUCTURE (MATCHES NEW SCREENSHOT 2) */}
                    {currentStep === 7 && (
                      <div>
                        <div className={styles.sectionHeaderBox}>
                          <div className={styles.sectionHeaderIcon} style={{ color: '#2563eb' }}><Building size={20} /></div>
                          <div>
                            <div className={styles.sectionTitle}>Infrastructure (For future THOTA applicants and THOTA centres)</div>
                            <div className={styles.sectionSubtitle}>Provide details about your hospital's critical infrastructure.</div>
                          </div>
                        </div>

                        <div className={styles.inputGrid}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Total ICU Bed Capacity <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="number" className={styles.inputField} placeholder="Enter total ICU bed capacity" value={formData.icuBeds} onChange={(e) => handleInputChange('icuBeds', e.target.value)} required />
                          </div>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Number of Ventilators <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="number" className={styles.inputField} placeholder="Enter number of ventilators" value={formData.ventilators} onChange={(e) => handleInputChange('ventilators', e.target.value)} required />
                          </div>
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Blood Bank <span style={{ color: '#ef4444' }}>*</span></label>
                          <div className={styles.radioOptionGrid}>
                            <div 
                              className={`${styles.radioCard} ${formData.bloodBankType === 'In-house' ? styles.radioCardSelected : ''}`}
                              onClick={() => handleInputChange('bloodBankType', 'In-house')}
                            >
                              <div className={`${styles.radioCircle} ${formData.bloodBankType === 'In-house' ? styles.radioCircleSelected : ''}`}>
                                {formData.bloodBankType === 'In-house' && <div className={styles.radioDot} />}
                              </div>
                              In-house Blood Bank
                            </div>

                            <div 
                              className={`${styles.radioCard} ${formData.bloodBankType === 'Tie-up' ? styles.radioCardSelected : ''}`}
                              onClick={() => handleInputChange('bloodBankType', 'Tie-up')}
                            >
                              <div className={`${styles.radioCircle} ${formData.bloodBankType === 'Tie-up' ? styles.radioCircleSelected : ''}`}>
                                {formData.bloodBankType === 'Tie-up' && <div className={styles.radioDot} />}
                              </div>
                              Tie-up with Blood Bank
                            </div>
                          </div>
                        </div>

                        <div className={styles.subDetailBox}>
                          {formData.bloodBankType === 'In-house' ? (
                            <div>
                              <div className={styles.subDetailTitle}>In-house Blood Bank Details</div>
                              <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>Blood Bank License Number <span style={{ color: '#ef4444' }}>*</span></label>
                                <input type="text" className={styles.inputField} placeholder="Enter blood bank license number" value={formData.bloodBankLicense} onChange={(e) => handleInputChange('bloodBankLicense', e.target.value)} required />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className={styles.subDetailTitle}>Tie-up Blood Bank Details</div>
                              <div className={styles.inputGrid}>
                                <div className={styles.inputGroup}>
                                  <label className={styles.inputLabel}>Tie-up Hospital / Blood Bank Name <span style={{ color: '#ef4444' }}>*</span></label>
                                  <input type="text" className={styles.inputField} placeholder="Enter tie-up hospital / blood bank name" value={formData.tieupHospitalName} onChange={(e) => handleInputChange('tieupHospitalName', e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                  <label className={styles.inputLabel}>Blood Bank License Number <span style={{ color: '#ef4444' }}>*</span></label>
                                  <input type="text" className={styles.inputField} placeholder="Enter blood bank license number" value={formData.bloodBankLicense} onChange={(e) => handleInputChange('bloodBankLicense', e.target.value)} required />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.inputLabel}>Number of Operating Theatres <span style={{ color: '#ef4444' }}>*</span></label>
                          <div className={styles.inputFieldWrapper}>
                            <Building2 size={16} className={styles.inputFieldIcon} />
                            <input type="number" className={`${styles.inputField} ${styles.inputFieldWithIcon}`} placeholder="Enter number of operating theatres" value={formData.operatingTheatres} onChange={(e) => handleInputChange('operatingTheatres', e.target.value)} required />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 8: DOCUMENT UPLOADS (MATCHES NEW SCREENSHOT 3) */}
                    {currentStep === 8 && (
                      <div>
                        <div className={styles.sectionHeaderBox}>
                          <div className={styles.sectionHeaderIcon} style={{ color: '#2563eb' }}><FileCheck2 size={20} /></div>
                          <div>
                            <div className={styles.sectionTitle}>Document Uploads</div>
                            <div className={styles.sectionSubtitle}>Upload all required documents to complete your hospital registration.</div>
                          </div>
                        </div>

                        <div className={styles.uploadAlertBox}>
                          <Info size={16} color="#10b981" />
                          <span>All documents must be clear and valid. Accepted formats: PDF, JPG, PNG. Max size: 20 MB per file.</span>
                        </div>

                        <div className={styles.docUploadStack}>
                          <PremiumUploadCard onUpload={handleFileUpload} onRemove={handleFileRemove} 
                            title="State Health Authority Hospital Registration Certificate" 
                            fieldId="docStateHealth" 
                            file={formData.docStateHealth} 
                            mandatory={true} requiredText="Mandatory" 
                            iconColor="#3b82f6"
                          />

                          {formData.isThotaRegistered && (
                            <>
                              <PremiumUploadCard onUpload={handleFileUpload} onRemove={handleFileRemove} 
                                title="THOTA Certificate of Registration (Form 12)" 
                                fieldId="docThotaCert" 
                                file={formData.docThotaCert} 
                                mandatory={true} requiredText="Mandatory if THOTA-authorized" 
                                iconColor="#3b82f6"
                              />
                              <PremiumUploadCard onUpload={handleFileUpload} onRemove={handleFileRemove} 
                                title="NOTTO ID Proof / Letter" 
                                fieldId="docNottoId" 
                                file={formData.docNottoId} 
                                mandatory={true} requiredText="Mandatory if THOTA-authorized" 
                                iconColor="#3b82f6"
                              />
                            </>
                          )}

                          {formData.isNabhAccredited && (
                            <PremiumUploadCard onUpload={handleFileUpload} onRemove={handleFileRemove} 
                              title="NABH Accreditation Certificate" 
                              fieldId="docNabhCert" 
                              file={formData.docNabhCert} 
                              mandatory={true} requiredText="Mandatory if NABH-accredited" 
                              iconColor="#3b82f6"
                            />
                          )}

                          <PremiumUploadCard onUpload={handleFileUpload} onRemove={handleFileRemove} 
                            title="Blood Bank License" 
                            fieldId="docBloodBank" 
                            file={formData.docBloodBank} 
                            mandatory={true} requiredText="Mandatory" 
                            iconColor="#3b82f6"
                          />

                          <PremiumUploadCard onUpload={handleFileUpload} onRemove={handleFileRemove} 
                            title="Medical Superintendent Appointment / Identity Proof" 
                            fieldId="docMsId" 
                            file={formData.docMsId} 
                            mandatory={true} requiredText="Mandatory" 
                            iconColor="#3b82f6"
                          />

                          {formData.isThotaRegistered && (
                            <>
                              <PremiumUploadCard onUpload={handleFileUpload} onRemove={handleFileRemove} 
                                title="Transplant Coordinator Appointment Letter" 
                                fieldId="docCoordAppt" 
                                file={formData.docCoordAppt} 
                                mandatory={true} requiredText="Mandatory if THOTA-authorized" 
                                iconColor="#8b5cf6"
                              />
                              <PremiumUploadCard onUpload={handleFileUpload} onRemove={handleFileRemove} 
                                title="List of Approved Organs from Appropriate Authority" 
                                fieldId="docApprovedOrgans" 
                                file={formData.docApprovedOrgans} 
                                mandatory={true} requiredText="Mandatory if THOTA-authorized" 
                                iconColor="#8b5cf6"
                              />
                            </>
                          )}

                        </div>
                      </div>
                    )}

                    {/* STEP 9: DECLARATIONS & SUMMARY */}
                    {currentStep === 9 && (
                      <div className={styles.step9Wrapper}>
                        {/* DSC Upload Section */}
                        <div className={styles.dscSectionBox}>
                          <div className={styles.dscHeader}>
                            <div className={styles.sectionHeaderIcon} style={{ color: '#7c3aed' }}><FileText size={20} /></div>
                            <div>
                              <div className={styles.sectionTitle}>Digital Signature Certificate (DSC)</div>
                              <div className={styles.sectionSubtitle}>Upload your DSC to complete and sign the registration.</div>
                            </div>
                          </div>
                          
                          <div className={styles.dscUploadWrapper}>
                            <div className={styles.uploadListRow} style={{ border: '1px solid #f1f5f9' }}>
                              <div className={styles.uploadListIconBox}>
                                <FileText size={20} color="#7c3aed" />
                              </div>
                              <div className={styles.uploadListTextCol}>
                                <div className={styles.uploadListTitle}>
                                  Upload Digital Signature Certificate (Mandatory) <span style={{ color: '#ef4444' }}>*</span>
                                </div>
                                <div className={styles.uploadListSubtext} style={{ color: '#64748b' }}>
                                  Accepted formats: .pfx, .p12
                                </div>
                              </div>
                              <div className={styles.uploadListRight}>
                                {formData.docDsc ? (
                                  <div className={styles.uploadListSuccess}>
                                    <div className={styles.uploadListFileDetails}>
                                      <CheckCircle2 size={16} color="#10b981" />
                                      <span className={styles.uploadListFileName}>{formData.docDsc.name}</span>
                                    </div>
                                    <button className={styles.uploadListBtnRemove} onClick={(e) => { e.preventDefault(); handleFileRemove('docDsc'); }}>
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <label className={styles.uploadListBtn}>
                                    <Upload size={14} />
                                    <span>Upload File</span>
                                    <input type="file" style={{ display: 'none' }} onChange={(e) => {
                                      if(e.target.files && e.target.files[0]) handleFileUpload('docDsc', e.target.files[0]);
                                    }} />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Declarations Section */}
                        <div className={styles.declarationsSectionBox}>
                          <div className={styles.dscHeader}>
                            <div className={styles.sectionHeaderIcon} style={{ color: '#2563eb' }}><Shield size={20} /></div>
                            <div>
                              <div className={styles.sectionTitle}>Declarations</div>
                              <div className={styles.sectionSubtitle}>Please read and accept all the declarations to proceed.</div>
                            </div>
                          </div>

                          <div className={styles.declarationList}>
                            <div className={`${styles.decItem} ${formData.declareTrue ? styles.decItemActive : ''}`} onClick={() => handleInputChange('declareTrue', !formData.declareTrue)}>
                              <div className={`${styles.decCheckbox} ${formData.declareTrue ? styles.decCheckboxChecked : ''}`}>
                                {formData.declareTrue && <Check size={12} strokeWidth={3} />}
                              </div>
                              <div className={styles.decText}>I hereby declare that the information provided is true and correct to the best of my knowledge. <span style={{ color: '#ef4444' }}>*</span></div>
                            </div>
                            
                            <div className={`${styles.decItem} ${formData.declareThotaComply ? styles.decItemActive : ''}`} onClick={() => handleInputChange('declareThotaComply', !formData.declareThotaComply)}>
                              <div className={`${styles.decCheckbox} ${formData.declareThotaComply ? styles.decCheckboxChecked : ''}`}>
                                {formData.declareThotaComply && <Check size={12} strokeWidth={3} />}
                              </div>
                              <div className={styles.decText}>I agree to comply with THOTA Act, Rules, and NOTTO data reporting requirements. <span style={{ color: '#ef4444' }}>*</span></div>
                            </div>
                            
                            <div className={`${styles.decItem} ${formData.declareLegalTerms ? styles.decItemActive : ''}`} onClick={() => handleInputChange('declareLegalTerms', !formData.declareLegalTerms)}>
                              <div className={`${styles.decCheckbox} ${formData.declareLegalTerms ? styles.decCheckboxChecked : ''}`}>
                                {formData.declareLegalTerms && <Check size={12} strokeWidth={3} />}
                              </div>
                              <div className={styles.decText}>I understand that false information may lead to cancellation of registration and legal action. <span style={{ color: '#ef4444' }}>*</span></div>
                            </div>
                          </div>

                          <div className={styles.decSecurityBanner}>
                            <Lock size={14} />
                            <span>Your information is secure and encrypted. We ensure the highest standards of data protection.</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 10: ACCOUNT SETUP */}
                    {currentStep === 10 && (
                      <div className={styles.step10Wrapper}>
                        <div className={styles.sectionHeaderBox}>
                          <div className={styles.sectionHeaderIcon} style={{ color: '#059669' }}><UserCheck size={20} /></div>
                          <div>
                            <div className={styles.sectionTitle}>Account Setup</div>
                            <div className={styles.sectionSubtitle}>Create the admin account for this hospital.</div>
                          </div>
                        </div>

                        <div className={styles.inputGrid}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Admin Display Name <span style={{ color: '#ef4444' }}>*</span></label>
                            <input 
                              type="text" 
                              className={styles.inputField} 
                              placeholder="e.g. Dr. Ramesh Sharma" 
                              value={formData.displayName} 
                              onChange={(e) => handleInputChange('displayName', e.target.value)} 
                              required 
                            />
                          </div>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Login Email <span style={{ color: '#ef4444' }}>*</span></label>
                            <input 
                              type="email" 
                              className={styles.inputField} 
                              placeholder="admin@hospital.com" 
                              value={formData.loginEmail} 
                              onChange={(e) => handleInputChange('loginEmail', e.target.value)} 
                              required 
                            />
                          </div>
                        </div>

                        <div className={styles.inputGrid}>
                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Password <span style={{ color: '#ef4444' }}>*</span></label>
                            <div className={styles.inputFieldWrapper}>
                              <Key size={16} className={styles.inputFieldIcon} />
                              <input 
                                type={showPassword ? "text" : "password"} 
                                className={`${styles.inputField} ${styles.inputFieldWithIcon}`} 
                                placeholder="Min 12 chars, upper, lower, number, special" 
                                value={formData.password} 
                                onChange={(e) => handleInputChange('password', e.target.value)} 
                                required 
                              />
                              <div className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </div>
                            </div>
                            <div className={styles.passwordStrengthBar}>
                              <div className={styles.passwordStrengthFill} style={{ width: `${(passwordStrength.score / 5) * 100}%`, backgroundColor: passwordStrength.color }}></div>
                            </div>
                            <div className={styles.passwordStrengthText} style={{ color: passwordStrength.color }}>
                              Strength: {passwordStrength.text || 'None'}
                            </div>
                          </div>

                          <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
                            <div className={styles.inputFieldWrapper}>
                              <Lock size={16} className={styles.inputFieldIcon} />
                              <input 
                                type="password" 
                                className={`${styles.inputField} ${styles.inputFieldWithIcon}`} 
                                placeholder="Re-enter password" 
                                value={formData.confirmPassword} 
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)} 
                                required 
                              />
                              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <CheckCircle2 size={16} className={styles.validCheckIcon} />
                              )}
                            </div>
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                              <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>Passwords do not match</div>
                            )}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                {/* Footer Action Buttons */}
                <div className={styles.footerButtonsContainer} style={{ flexShrink: 0 }}>
                  <div className={styles.footerButtonsRow}>
                    {currentStep > 1 && (
                      <button type="button" className={styles.btnBackPill} onClick={handlePrevStep}>
                        <ArrowLeft size={16} /> Back
                      </button>
                    )}

                    <button type="submit" className={`${styles.btnSaveContinuePill} ${currentStep === 1 ? styles.btnSaveFullWidth : ''}`}>
                      <div className={styles.btnShine}></div>
                      <div className={styles.btnContent}>
                        {currentStep === 10 ? (
                          <>
                            <span className={styles.btnText}><Lock size={16} style={{marginRight: '6px', verticalAlign: 'middle'}}/> Submit Registration</span>
                            <ArrowRight size={18} className={styles.btnArrow} />
                          </>
                        ) : (
                          <>
                            <span className={styles.btnText}>Save & Continue</span>
                            <ArrowRight size={18} className={styles.btnArrow} />
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                  
                  {currentStep === 1 && (
                    <div className={styles.loginLinkContainer}>
                      Already registered? <Link to="/login?role=hospital" className={styles.loginLink}>Log in here</Link>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

      </main>

      {/* SUCCESS SUBMISSION SCREEN */}
      {isSubmitted && (
        <div className={styles.successScreenOverlay}>
          <div className={styles.successScreenContent}>
            <div className={styles.successIconCircle}>
              <CheckCircle2 size={48} className={styles.successIconColor} />
            </div>
            <h2 className={styles.successTitle}>Registration Submitted</h2>
            <p className={styles.successSubtitle}>
              Hospital Code: <strong>{hospitalCode || registrationId}</strong><br/>
              Your hospital registration has been securely transmitted.
            </p>
            
            <div className={styles.statusTimeline}>
              <div className={`${styles.timelineNode} ${styles.timelineNodeActive}`}>
                <div className={styles.timelineDot}><Check size={10} strokeWidth={4} /></div>
                <div className={styles.timelineLabel}>Submitted</div>
              </div>
              <div className={styles.timelineLine}></div>
              <div className={`${styles.timelineNode} ${styles.timelineNodeCurrent}`}>
                <div className={styles.timelineDot}></div>
                <div className={styles.timelineLabel}>Review</div>
              </div>
              <div className={styles.timelineLine}></div>
              <div className={styles.timelineNode}>
                <div className={styles.timelineDot}></div>
                <div className={styles.timelineLabel}>Verification</div>
              </div>
              <div className={styles.timelineLine}></div>
              <div className={styles.timelineNode}>
                <div className={styles.timelineDot}></div>
                <div className={styles.timelineLabel}>Approval</div>
              </div>
            </div>

            <div className={styles.successNoticeBox}>
              <ShieldCheck size={16} />
              <span>Status: Pending Admin Approval</span>
            </div>

            <button onClick={() => navigate('/login?role=hospital')} className={styles.btnReturnLogin}>
              Return to Login Portal
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showSubmitConfirm && (
        <div className={styles.confirmDialogOverlay}>
          <div className={styles.confirmDialogBox}>
            <div className={styles.confirmDialogIcon}><ShieldCheck size={32} /></div>
            <h3 className={styles.confirmDialogTitle}>Review Confirmation</h3>
            <p className={styles.confirmDialogText}>
              Your application will be submitted for verification.<br />
              You can no longer edit the information after submission.
            </p>
            
            {apiError && (
              <div className={styles.apiErrorBox}>
                <AlertCircle size={16} />
                <span>{apiError}</span>
              </div>
            )}

            <div className={styles.confirmDialogActions}>
              <button className={styles.btnCancel} onClick={() => setShowSubmitConfirm(false)} disabled={isSubmitting}>Cancel</button>
              <button className={styles.btnSubmitFinal} disabled={isSubmitting} onClick={async () => {
                if (formData.password !== formData.confirmPassword) {
                  setApiError("Passwords do not match");
                  return;
                }
                setIsSubmitting(true);
                setApiError(null);
                
                try {
                  const apiData = new FormData();
                  
                  // Construct nested JSON payload
                  const payload = {
                    name: formData.hospitalLegalName,
                    tradeName: formData.tradeName || null,
                    establishmentYear: formData.establishmentYear ? parseInt(formData.establishmentYear) : null,
                    hospitalType: formData.hospitalType.toUpperCase(),
                    address: {
                      street: formData.addressLine1 + (formData.addressLine2 ? ', ' + formData.addressLine2 : ''),
                      city: formData.district,
                      state: formData.state,
                      pincode: formData.pin
                    },
                    contact: {
                      phone: formData.nodalMobile,
                      email: formData.officialEmail,
                      landline: formData.landline || null
                    },
                    legalDetails: {
                      registrationNumber: formData.healthAuthRegNo,
                      gstin: formData.gstin || null,
                      pan: formData.pan || null,
                      cin: formData.cin || null,
                      pmjayId: formData.pmjayId || null,
                      abdmHfrId: formData.abdmHfrId || null
                    },
                    keyPersonnel: {
                      headName: formData.headName || null,
                      headRegNo: formData.headRegNo || null,
                      headEmail: formData.headEmail || null,
                      headMobile: formData.headMobile || null,
                      coordName: formData.coordName || null,
                      coordQualification: formData.coordQualification || null,
                      coordEmail: formData.coordEmail || null,
                      coordMobile: formData.coordMobile || null,
                    },
                    accreditation: {
                      isNabh: formData.isNabhAccredited,
                      nabhNumber: formData.nabhNumber || null,
                      nabhValidUntil: formData.nabhValidUntil || null
                    },
                    thota: {
                      isRegistered: formData.isThotaRegistered,
                      regNumber: formData.thotaRegNumber || null,
                      issuingAuthority: formData.issuingAuthority || null,
                      validUntil: formData.thotaValidUntil || null,
                      authTypes: formData.thotaAuthTypes || [],
                      approvedOrgans: formData.approvedOrgans ? formData.approvedOrgans.map(o => o.toUpperCase()) : [],
                      nottoId: formData.nottoId || null,
                      sottoId: formData.sottoId || null,
                      rottoId: formData.rottoId || null
                    },
                    infrastructure: {
                      icuBeds: formData.icuBeds ? parseInt(formData.icuBeds) : null,
                      ventilators: formData.ventilators ? parseInt(formData.ventilators) : null,
                      bloodBankType: formData.bloodBankType || null,
                      bloodBankLicense: formData.bloodBankLicense || null,
                      operatingTheatres: formData.otCount ? parseInt(formData.otCount) : null
                    },
                    loginEmail: formData.loginEmail,
                    password: formData.password,
                    displayName: formData.displayName,
                  };

                  apiData.append('hospitalData', JSON.stringify(payload));
                  
                  // Append files
                  if (formData.docStateHealth) apiData.append('docStateHealth', formData.docStateHealth);
                  if (formData.docThotaCert) apiData.append('docThotaCert', formData.docThotaCert);
                  if (formData.docNottoId) apiData.append('docNottoId', formData.docNottoId);
                  if (formData.docNabhCert) apiData.append('docNabhCert', formData.docNabhCert);
                  if (formData.docBloodBank) apiData.append('docBloodBank', formData.docBloodBank);
                  if (formData.docMsId) apiData.append('docMsId', formData.docMsId);
                  if (formData.docCoordAppt) apiData.append('docCoordAppt', formData.docCoordAppt);
                  if (formData.docApprovedOrgans) apiData.append('docApprovedOrgans', formData.docApprovedOrgans);
                  if (formData.docDsc) apiData.append('docDsc', formData.docDsc);

                  const result = await publicRegisterHospital(apiData);
                  setHospitalCode(result.hospitalCode);
                  registerHospitalInRegistry(payload);
                  setShowSubmitConfirm(false);
                  setIsSubmitted(true);
                  localStorage.removeItem(DRAFT_KEY);
                } catch (err) {
                  setApiError(err.message || "Failed to submit registration");
                } finally {
                  setIsSubmitting(false);
                }
              }}>
                {isSubmitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterHospital;

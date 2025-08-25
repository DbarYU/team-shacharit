import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  const serviceAccount = {
    type: "service_account",
    project_id: "team-shach",
    private_key_id: "1d39ebada2d96420c3afe1e6dd4e36f5f14ee6ce",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCnmFNKXAztLK+K\nqbDq2NPubSIclqwNP4c2eBCBBaUuNJCUrwt9z0yTTCzvMVA0+WVhsJKnUYonLMCt\nm5jtq1IzLeXBCwfTIFYt6uMuXtmHqPEcn/sQ/yTDzXU/CSjfwQR3MPHUjGp2jkeL\ntrT2wiFDgcdKWZkhqWtRU4UgWuwOIxUcJ/mvauQMdYRh99reHf/K22WCaHcOUdtH\n/GTh+zaAzEkxMJuXJgUB3rQdOY07B8A+U8kgyrYDteKW1QZ59fXOmuDvUpOJh8tD\nyrd0bdlQ3VUpwHiMaTc8rPhR6HQ2hWjJxNwJovzUPZ8UV/WxeOtaHRzcmBEd6Tsc\nWnZnzB7DAgMBAAECggEADg9PXXufcf4/s8hMmUcbcHMjW3agdHQR6dXkvI42r0ul\nnXOZ6TIM4IaRdneSnP8XLDzd8L98cZDlkSruh3HJ8ZU2Ix3DyEh8Mln0OR2n7iOU\nJqydKW3eLbb80Q75qNvOfhlTEFu/Srbg9a2cPN9IXxtyFqCxogtOf4IcNvyptP3F\nak1aSja2xBtprWcWnvgb9ppEdFK3p8gLE0wEYGMSdRh+pvxFTDURUiqOt63OyOrT\ngeJmvmI+zjqozMSDwIJdAh4UGa9WmAzzYBPONWoGOACt2UrcBEv8V/cEPx+BdSla\nsDA1iZtmAtylEvi8s4TpcOHETN+t7eryFODq8Ar8QQKBgQDrrj9Xq84OtPo1foD2\nifzh0/JVWlPth+OrlHsQfLYST8+7ldb2k96eYmukdhjZ+qVyvjWWXYaNyFqvr7wt\nSTvc7RKvAL8c4h2bgnjzLFjfHfrF9RF/1/FRsLvyql/GxCksjESnFiHyNYGt9wkB\n/JzmS8lsLHB7MEaKF0/1FO6qUwKBgQC2C1jSFjDbK5yQUTkOU0Hagk60xg7zYn+P\njquHyBnkZKBfEZNeZufIoDM6wjPcwFsE7FVMhZJTmx0JZVAj6/7Ygmao9NdufMjr\n0b9ce9k1VO1Gkd5PoTD/t429wW8iYV+wG9dKkI/duMdOWal8B3qo3z4fkePYt6zv\na+W6vKiL0QKBgQDH4nXohlbyFD3tZsg70JZAdcCe8UgjOdA3MmwZdJv69ePKRfAW\nGx2BGRoQVvUG0tTFd1r9l37J+zYmsRYZFnaGDi99a1WrSn8v6D1qiJ8rRELu58Wa\ntuv9i7YrvqISc0Y0eRa020mZIhZFFDJ4k+YCUB6Z9yrC4BPDhLgUtVch7wKBgBXf\n6S1dc0Nyyx5gVC3PfVNHYzO/tN40EMXsS9pGBi52lPq3fvDSBroJ3f4KhfbZulYu\nG9XVGw8mzWdqoCWg3v+fM7zLpvNk1TPZAViYnTIWYWigcIk7AktIACU0ECmeb8QW\npFkWY+Mtp+1XQtFfiLKwGKPsgOdysroWSgWVU99xAoGAfUFLQAOeyP3SPldSbf34\n+05ggTUQoaBb2AoCDcljEiQk67q5cnZHxd549JuJGUPkqeCn6hdQq3jdP7/T0R0r\npAF8CElGLySIVBgMY5dRDtlDB/93Lzq9qaCRiS3dH1aLfMsMJhGbBCNe8lZTZl14\nLnpDHvJmv5LjtH5sYtogu8Q=\n-----END PRIVATE KEY-----\n",
    client_email: "firebase-adminsdk-fbsvc@team-shach.iam.gserviceaccount.com",
    client_id: "107514590596329240426",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40team-shach.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
  };

  initializeApp({
    credential: cert(serviceAccount as any),
    projectId: 'team-shach',
  });
}

export const adminDb = getFirestore();
export default adminDb;

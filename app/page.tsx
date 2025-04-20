'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  const createRoom = () => {
    // Generate a random room code
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    router.push(`/game/${newRoomCode}`);
  };

  const joinRoom = () => {
    if (roomCode) {
      router.push(`/game/${roomCode.toUpperCase()}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F5FF] flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="mb-4 flex justify-center">
          <svg width="183" height="125" viewBox="0 0 183 125" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M59.7556 40.4536L58.6172 87.2722L44.1515 88.4192L41.5196 41.9087L59.7556 40.4536ZM103.214 54.5307C103.262 56.3158 103.146 57.9449 102.865 59.4182C102.607 60.868 102.162 62.2083 101.531 63.4391C100.9 64.67 100.073 65.8145 99.0478 66.8728C98.0229 67.9311 96.7794 68.9495 95.3173 69.928L103.881 84.2618L88.5152 87.7003L82.8334 73.2199L78.5805 73.4724L78.3488 87.7692L63.5881 88.1684C63.5614 82.9475 63.5239 77.7499 63.4756 72.5755C63.4502 67.4004 63.4355 62.2022 63.4317 56.9807C63.4063 54.3477 63.3815 51.7376 63.3574 49.1504C63.3332 46.5632 63.3542 43.9519 63.4203 41.3164C65.0062 40.6781 66.5719 40.1433 68.1176 39.7122C69.6632 39.2811 71.2113 38.9415 72.7619 38.6934C74.3348 38.4219 75.9212 38.2301 77.5213 38.1181C79.1437 37.9827 80.8016 37.892 82.495 37.8462C85.1039 37.7757 87.6311 38.0737 90.0767 38.7405C92.5446 39.3837 94.7363 40.4008 96.6518 41.7918C98.5674 43.1827 100.115 44.9387 101.294 47.0595C102.497 49.1797 103.137 51.6701 103.214 54.5307ZM87.8653 56.0451C87.8393 55.084 87.6781 54.2066 87.3818 53.4131C87.1084 52.6189 86.7008 51.9429 86.159 51.385C85.6395 50.8036 84.9863 50.3632 84.1996 50.0639C83.4351 49.741 82.5379 49.5935 81.5081 49.6214C81.0504 49.6338 80.6051 49.6802 80.1721 49.7606C79.7386 49.8181 79.3174 49.9097 78.9085 50.0352L78.7046 62.8198L79.5285 62.7975C80.5125 62.7709 81.5046 62.6181 82.5048 62.3391C83.5278 62.0596 84.4326 61.6458 85.2194 61.0978C86.029 60.5491 86.6744 59.8561 87.1556 59.0186C87.6596 58.1805 87.8962 57.1894 87.8653 56.0451ZM123.124 38.7399L121.985 85.5585L107.519 86.7055L104.888 40.1949L123.124 38.7399Z" fill="#8A7DC5"/>
            <path d="M37.9377 41.441C37.8586 43.5959 37.7903 45.7276 37.7328 47.8361C37.6753 49.9446 37.5841 52.0769 37.4592 54.233L22.9249 55.3818L23.0419 59.707L35.6743 59.3654L35.2755 70.0254L23.2703 70.6936L23.8514 89.6403L6.49115 90.4534L6.28806 42.2969L37.9377 41.441Z" fill="#8A7DC5"/>
            <path d="M177.004 37.783L175.85 84.0157L161.384 85.1627L158.752 38.6522L177.004 37.783Z" fill="#7DA7C5"/>
            <path d="M151.578 58.6014C151.859 57.1281 151.975 55.499 151.927 53.714C151.85 50.8534 151.21 48.363 150.007 46.2427C148.828 44.1219 147.28 42.366 145.365 40.975C143.449 39.584 141.257 38.5669 138.79 37.9237C136.344 37.257 133.817 36.9589 131.208 37.0295C129.514 37.0752 127.857 37.1659 126.234 37.3014L127.621 49.2184C128.03 49.0929 128.451 49.0013 128.885 48.9438C129.318 48.8634 129.763 48.817 130.221 48.8046C131.251 48.7768 132.148 48.9243 132.912 49.2471C133.699 49.5465 134.352 49.9868 134.872 50.5682C135.414 51.1261 135.821 51.8021 136.095 52.5963C136.391 53.3898 136.552 54.2672 136.578 55.2283C136.609 56.3726 136.372 57.3637 135.868 58.2018C135.387 59.0393 134.742 59.7323 133.932 60.281C133.145 60.829 132.241 61.2428 131.218 61.5224C130.217 61.8013 129.225 61.9541 128.241 61.9807L127.418 62.003L127.293 72.6556L131.546 72.4031L137.228 86.8836L152.594 83.445L144.03 69.1112C145.492 68.1327 146.736 67.1143 147.761 66.0561C148.785 64.9978 149.613 63.8532 150.244 62.6224C150.875 61.3915 151.32 60.0512 151.578 58.6014Z" fill="#7DA7C5"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M120.505 25.2055L122.222 34.9382L151.43 35.4419L157.807 35.5415L166.799 35.6818L168.117 35.7024L176.327 35.8305L180.139 35.9396L181.412 26.631L171.697 26.2545C171.273 20.837 169.535 18.2825 166.357 13.9043C162.057 7.98072 157.106 5.00706 151.505 4.98328C147.494 4.98434 143.815 6.23187 140.465 8.72587C137.053 11.2189 134.712 14.3652 133.443 18.1648C132.976 19.5579 132.707 20.4768 132.636 20.9213C132.375 22.5301 132.186 24.1643 132.076 25.4485L120.505 25.2055ZM157.904 26.0393L163.441 26.1257C163.051 22.5548 162.471 21.4539 160.417 18.4936C158.053 14.9556 154.669 13.34 151.424 13.2893C147.987 13.2357 144.497 14.7625 140.985 19.5456C139.944 20.9935 139.315 22.057 139.194 25.7472L157.904 26.0393Z" fill="#7DA7C5"/>
          </svg>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          A party game for not-so-surilo people
        </h1>
        
        {/* Example text */}
        <p className="text-gray-600 mb-8 italic">
          "You just farted." Your friend plays "Najeek na aau, dar lagdai cha."
        </p>

        {/* Buttons */}
        <div className="space-y-4">
          {!showJoinInput ? (
            <>
              <button
                onClick={() => createRoom()}
                className="w-full py-3 px-6 bg-[#8A7DC5] text-white rounded-lg hover:bg-[#7A6DB5] transition-colors font-medium"
              >
                create a room
              </button>
              <button
                onClick={() => setShowJoinInput(true)}
                className="w-full py-3 px-6 bg-[#D4E5FF] text-[#8A7DC5] rounded-lg hover:bg-[#C4D5FF] transition-colors font-medium"
              >
                join a room
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                className="w-full p-3 border border-[#8A7DC5] rounded-lg text-center uppercase"
                maxLength={6}
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setShowJoinInput(false)}
                  className="flex-1 py-3 px-6 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={joinRoom}
                  className="flex-1 py-3 px-6 bg-[#8A7DC5] text-white rounded-lg hover:bg-[#7A6DB5] transition-colors font-medium"
                  disabled={!roomCode}
                >
                  Join
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function DebugAuth() {
    const [logs, setLogs] = useState<string[]>([]);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        addLog("Checking session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) addLog(`Session Error: ${error.message}`);
        else if (session) {
            addLog(`Session found for: ${session.user.email} (${session.user.id})`);
            checkRole(session.user.id);
        } else {
            addLog("No active session.");
        }
    };

    const checkRole = async (userId: string) => {
        addLog(`Checking role for ${userId}...`);
        const { data, error } = await supabase
            .from("user_roles")
            .select("*")
            .eq("user_id", userId);

        if (error) {
            addLog(`Role Fetch Error: ${error.message} (Code: ${error.code})`);
            addLog(`Details: ${JSON.stringify(error)}`);
        } else {
            addLog(`Role Data: ${JSON.stringify(data)}`);
        }
    };

    const handleLogin = async () => {
        addLog(`Attempting login for ${email}...`);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            addLog(`Login Error: ${error.message}`);
        } else {
            addLog("Login successful!");
            if (data.user) checkRole(data.user.id);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        addLog("Logged out.");
        setLogs([]);
    };

    return (
        <div className="p-8 font-mono text-sm">
            <h1 className="text-xl font-bold mb-4">Auth Debugger</h1>

            <div className="mb-4 space-y-2">
                <input
                    className="border p-2 mr-2"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <input
                    className="border p-2 mr-2"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <button className="bg-blue-500 text-white p-2 rounded mr-2" onClick={handleLogin}>Login</button>
                <button className="bg-red-500 text-white p-2 rounded mr-2" onClick={handleLogout}>Logout</button>
                <button className="bg-gray-500 text-white p-2 rounded" onClick={checkSession}>Check Session</button>
            </div>

            <div className="bg-gray-100 p-4 rounded h-96 overflow-auto border">
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </div>
    );
}

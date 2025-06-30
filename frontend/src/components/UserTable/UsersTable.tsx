import React, { useState, useEffect, useRef } from 'react';
import style from "./UsersTable.module.css";
import EditUserWindow from "../EditUserWindow/EditUserWindow";

const SERVER_URL = "http://localhost:3001";

interface User {
    id: number;
    FIO: string;
    post: string;
    address: string;
    age: number;
    salary: number;
    haveINN: boolean | null;
    INN: number | null;
}

export default function UsersTable() {
    const [loadedAllData, setLoadedAllData] = useState(false);
    const [dataIsLoading, setDataIsLoading] = useState(false);
    const [USERS, setUSERS] = useState<User[]>([]);
    const [currentUsersPart, setCurrentUsersPart] = useState(0);
    const [columnsVisibility, setColumnsVisibility] = useState({
        id: true,
        FIO: true,
        post: true,
        address: true,
        age: true,
        salary: true
    });
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedVisibility = localStorage.getItem('columnsVisibility');
        if (storedVisibility) {
            setColumnsVisibility(JSON.parse(storedVisibility));
        }
    }, []);

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            loadPartOfUsers(currentUsersPart);
        }
    }, []);

    const loadPartOfUsers = async (part: number) => {
        if (dataIsLoading || loadedAllData) return;

        setDataIsLoading(true);
        try {
            const url = new URL(`${SERVER_URL}/users`);
            url.search = new URLSearchParams({start: String(part)}).toString();

            const response = await fetch(url);
            if (!response.ok) throw new Error(response.statusText);

            const data = await response.json();

            if (data.length === 0) {
                setLoadedAllData(true);
            } else {
                setUSERS(prev => [...prev, ...data]);
                setCurrentUsersPart(part + 1);
            }
        } catch (error) {
            console.error("Failed to load users:", error);
        } finally {
            setDataIsLoading(false);
        }
    };

    const needToLoadNewData = () => {
        if (!tableContainerRef.current) return false;

        const element = tableContainerRef.current;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        const scrollTop = element.scrollTop;
        const criticalPoint = scrollHeight - clientHeight / 3;
        const currentPosition = scrollTop + clientHeight;

        return currentPosition >= criticalPoint;
    };

    useEffect(() => {
        const handleScroll = () => {
            if (needToLoadNewData() && !loadedAllData && !dataIsLoading) {
                loadPartOfUsers(currentUsersPart);
            }
        };

        const tableContainer = tableContainerRef.current;
        if (tableContainer) {
            tableContainer.addEventListener('scroll', handleScroll);
            return () => {
                tableContainer.removeEventListener('scroll', handleScroll);
            };
        }
    }, [currentUsersPart, loadedAllData, dataIsLoading]);

    const handleUserClick = (user: User) => {
        setEditingUser(user);
    };

    const handleCloseEditWindow = () => {
        setEditingUser(null);
    };

    const handleSaveUser = async (userData: any) => {
        try {
            const response = await fetch(`http://localhost:3001/users/${userData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...userData,
                    age: Number(userData.age),
                    salary: Number(userData.salary),
                    INN: userData.haveINN ? Number(userData.INN) : null
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to save user');
            }

            const updatedUser = await response.json();
            setUSERS(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
            setEditingUser(null);

        } catch (error) {
            console.error('Save error:', error);
            alert(`Ошибка сохранения`);
        }
    };

    return (
        <div
            ref={tableContainerRef}
            className={style.usersTableContainer}
        >
            <table className={style.usersTable}>
                <thead>
                <tr>
                    {columnsVisibility.id && <th className={style.usersTable__Th}>Id</th>}
                    {columnsVisibility.FIO && <th className={style.usersTable__Th}>ФИО</th>}
                    {columnsVisibility.post && <th className={style.usersTable__Th}>Должность</th>}
                    {columnsVisibility.address && <th className={style.usersTable__Th}>Адрес</th>}
                    {columnsVisibility.age && <th className={style.usersTable__Th}>Возраст</th>}
                    {columnsVisibility.salary && <th className={style.usersTable__Th}>Зарплата</th>}
                </tr>
                </thead>
                <tbody className={style.usersTable__element}>
                {USERS.map(user => (
                    <tr key={user.id}>
                        {columnsVisibility.id && <td>{user.id}</td>}
                        {columnsVisibility.FIO && (
                            <td
                                onClick={() => handleUserClick(user)}
                            >
                                {user.FIO}
                            </td>
                        )}
                        {columnsVisibility.post && <td>{user.post}</td>}
                        {columnsVisibility.address && <td>{user.address}</td>}
                        {columnsVisibility.age && <td>{user.age}</td>}
                        {columnsVisibility.salary && <td>{user.salary}</td>}
                    </tr>
                ))}
                {dataIsLoading && <tr>
                    <td colSpan={6}>Загрузка...</td>
                </tr>}
                </tbody>
            </table>

            {editingUser && (
                <EditUserWindow
                    onClose={handleCloseEditWindow}
                    user={editingUser}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
}
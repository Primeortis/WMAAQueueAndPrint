import { Box, Button, LinearProgress, Select, MenuItem, Modal, TextField } from "@mui/material";
import Navbar from "../../../components/navbar/nav.jsx";
import styles from "../../pagestyles.module.css";
import {firebaseApp} from "../../../src/firebase-config.js"
import {getAuth} from "firebase/auth"
import { useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { useState } from "react";
import ConfirmModal from "../../../components/confirmModal.jsx";
import Alert from '@mui/material/Alert';


export default function UserManagementPage(props){
    const auth = getAuth(firebaseApp);
    const functions = getFunctions(firebaseApp);
    let [userInformation, setUserInformation] = useState({});
    let [userIDOrEmail, setUserIDOrEmail] = useState("");
    let [loadingInformation, setLoadingInformation] = useState(false);
    let [modal1Open, setModal1Open] = useState(false);
    let [modal2Open, setModal2Open] = useState(false);
    let [modal2Message, setModal2Message] = useState("");
    let [userLevel, setUserLevel] = useState(null);
    let [error, setError] = useState(null);
    let navigate = useNavigate();

    // REMOVE BELOW IN PRODUCTION
    connectFunctionsEmulator(functions, "localhost", 5001);
    // --------

    let emailRegex = new RegExp("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$");

    function getUserInformation(){
        setLoadingInformation(true)
        setUserIDOrEmail(userIDOrEmail.trim());
        if(emailRegex.test(userIDOrEmail)){
            let getUser = httpsCallable(functions, "getuserinformation");
            getUser({email: userIDOrEmail}).then((result)=>{
                if(result.data.result.error){
                    setError(result.data.result.message);
                    console.log(result.data.result.message)
                } else {
                    setError(null)
                    setUserInformation(result.data.result);
                    console.log(result.data.result)
                }
                setLoadingInformation(false)
            }).catch((error)=>{
                console.error(error);
            })
        } else {
            let getUser = httpsCallable(functions, "getuserinformation");
            getUser({uid: userIDOrEmail}).then((result)=>{
                setUserInformation(result.data.result);
                console.log(result.data.result)
                setLoadingInformation(false)
            }).catch((error)=>{
                console.error(error);
            })
        }
    }

    function editUserButton(){
        setModal1Open(true)
    }

    function pauseUserButton(){
        setModal2Message("Are you sure you want to " + (userInformation.disabled?"unpause the user?":"pause the user?"))
        setModal2Open(true)
    }

    function applyUserEdits(){
        let updateUser = httpsCallable(functions, "setrole");
        updateUser({uid: userInformation.uid, role: userLevel}).then((result)=>{
            console.log(result)
            setTimeout(()=>getUserInformation(), 500);
        }).catch((error)=>{
            console.error(error)
        })
        setModal1Open(false);
    }

    function pauseUser(){
        let pauseUser = httpsCallable(functions, "pauseuser");
        pauseUser({uid: userInformation.uid, disabled:!userInformation.disabled}).then((result)=>{
            console.log(result)
            setTimeout(()=>getUserInformation(), 500);
        }).catch((error)=>{
            console.error(error)
        })
        setModal2Open(false);
    }

    return (
        <>
            <Navbar admin={true}/>
            <div className={styles.body} style={{paddingTop:"5vh"}}>
                <h1>Manage User</h1>
                <div className={styles.popout}>
                    <p>Input user to edit permissions</p>
                    <TextField label="User UID or Email" variant="outlined" fullWidth value={userIDOrEmail} onChange={(e)=>setUserIDOrEmail(e.target.value)}/>
                    <Button variant="contained" onClick={getUserInformation}>Get User Information</Button>
                    {loadingInformation?<LinearProgress/>:null}
                    {error!=null?<Alert severity="error">{error}</Alert>:null}
                    <br/>
                    {userInformation.displayName?
                        <>
                        <p>Display Name: {userInformation.displayName}</p>
                        <p>Paused? {userInformation.disabled.toString()}</p>
                        <p>Email: {userInformation.email}</p>
                        <p>Role: {userInformation.role}</p>
                        <p>Last Signed In At: {userInformation.lastSignIn}</p>
                        <Button variant="contained" onClick={editUserButton}>Edit User</Button>
                        {modal1Open?
                            <Modal open={modal1Open} onClose={()=>{setModal1Open(false)}}>
                                <Box sx={{width: "80%", backgroundColor:"rgba(91,91,91,0.8)", margin:"auto", padding:"2px", marginTop:"5vh"}}>
                                    <h1>Edit Info</h1>
                                    <p>Set Role</p>
                                    <Select variant="filled" style={{width: "25%", minWidth:"40px"}} value = {userLevel} onChange = {(e)=>{setUserLevel(e.target.value)}}>
                                        <MenuItem value="apprentice">Set to Apprentice</MenuItem>
                                        <MenuItem value="journeyman">Set to Journeyman</MenuItem>
                                        <MenuItem value="master">Set to Master</MenuItem>
                                        <MenuItem value="admin">Set as Admin</MenuItem>
                                    </Select>
                                    <p></p>
                                    <Button variant="contained" onClick={applyUserEdits}>Save and Leave</Button>
                                </Box>
                            </Modal>
                        :null}
                        <Button variant="contained" onClick={pauseUserButton}>{userInformation.disabled?"Unpause User":"Pause User"}</Button>
                        {modal2Open?<ConfirmModal message={modal2Message} onConfirm={pauseUser} onCancel={()=>{setModal2Open(false)}}/>:null}
                        </>
                    :<p>Enter a search query above...</p>}
                </div>
            </div>
        </>
    )
}
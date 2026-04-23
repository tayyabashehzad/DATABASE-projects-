import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    p_id: null,
    user_name: null,
};

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.p_id = action.payload.p_id;
            state.user_name = action.payload.user_name;
        },
        clearUser: (state) => {
            state.p_id = null;
            state.user_name = null;
        },
    },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
